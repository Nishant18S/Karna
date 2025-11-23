#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <Wire.h>
#include <SPI.h>
#include <SD.h>
#include "DHT.h"
#include <LoRa.h>
#include <WiFi.h>
#include <WebServer.h>

// Pin Definitions
#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135PIN 34
#define SD_CS 5
#define BUZZER_PIN 13
#define LED_PIN 15

// LoRa Pin Definitions
#define LORA_SS 32
#define LORA_RST 14
#define LORA_DIO0 2
#define OLED_RESET -1

// WiFi credentials - CONNECT TO EXISTING HOTSPOT
const char* wifi_ssid = "Esp32";        // Connect to this existing hotspot
const char* wifi_password = "00000001";     // Hotspot password

const int GAS_THRESHOLD = 5500;

DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(128, 64, &Wire, OLED_RESET);
WebServer server(80);

// Timing Variables
unsigned long prevLedMillis = 0;
unsigned long prevLoRaMillis = 0;
unsigned long prevWiFiCheckMillis = 0;
unsigned long prevNetworkTestMillis = 0;
unsigned long prevBuzzerMillis = 0;  // NEW: Timer for regular buzzer
const long ledInterval = 1000;
const long loraInterval = 10000;
const long wifiCheckInterval = 5000;
const long buzzerInterval = 10000;  // NEW: Buzzer every 10 seconds
bool ledState = false;

// Global sensor variables
float temperature = 0.0;
float humidity = 0.0;
int gasRaw = 0;
String gasLevel = "Normal";
String environmentStatus = "Normal Environment";

// WiFi status variables
bool wifiConnected = false;
String wifiStatus = "Connecting...";
String espIP = "No IP";

// Function Prototypes
void handleKishanSetuPage();
void handleSensorAPI();
void updateOLEDDisplay();
void logDataToSD();
void sendLoRaData(float temp, float hum, int gas, String level);
void checkWiFiStatus();
void printNetworkDiagnostics();
void testNetworkConnectivity();

void setup() {
  Serial.begin(115200);
  
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Startup buzzer sound
  for(int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
  
  dht.begin();
  
  // Initialize OLED
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED initialization failed");
    while (true);
  }
  display.clearDisplay();
  display.display();
  
  // Initialize SD Card
  SPI.begin(18, 19, 23, 5);
  if (!SD.begin(SD_CS)) {
    Serial.println("SD Card initialization failed");
  } else {
    Serial.println("SD Card initialized");
  }
  
  // Initialize LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa initialization failed!");
  } else {
    LoRa.setSpreadingFactor(12);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(8);
    LoRa.setPreambleLength(8);
    LoRa.setSyncWord(0x12);
    LoRa.enableCrc();
    Serial.println("LoRa initialized successfully!");
  }
  
  // Set WiFi to Station mode only (connect to existing hotspot)
  WiFi.mode(WIFI_STA);
  
  // Connect to existing hotspot
  Serial.println("Connecting to hotspot: " + String(wifi_ssid));
  WiFi.begin(wifi_ssid, wifi_password);
  
  // Wait for connection with timeout
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 30) {
    delay(500);
    Serial.print(".");
    timeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ Connected to ESP32 hotspot!");
    Serial.println("ESP32 IP: " + WiFi.localIP().toString());
    wifiConnected = true;
    espIP = WiFi.localIP().toString();
    wifiStatus = "Connected to " + String(wifi_ssid);
    
    // Print detailed network diagnostics
    printNetworkDiagnostics();
  } else {
    Serial.println();
    Serial.println("❌ Failed to connect to ESP32 hotspot");
    wifiConnected = false;
    espIP = "Connection Failed";
    wifiStatus = "Connection Failed";
  }
  
  // Initial status check
  checkWiFiStatus();
  
  // Define web server routes - Show Kishan Setu page first
  server.onNotFound(handleKishanSetuPage);
  server.on("/", handleKishanSetuPage);
  server.on("/api/sensors", handleSensorAPI);  // Keep sensor API
  
  server.begin();
  
  Serial.println("=== KISHAN SETU SETUP COMPLETE ===");
  Serial.println("🌾 Kishan Setu Platform started on: " + espIP);
  Serial.println("📱 Connected to: " + String(wifi_ssid));
  Serial.println("🔗 Visit " + espIP + " for Kishan Setu");
  Serial.println("💻 Target: http://172.20.10.2:8080/");
  Serial.println("===================================");
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Handle web server clients
  server.handleClient();
  
  // LED blinking
  if (currentMillis - prevLedMillis >= ledInterval) {
    prevLedMillis = currentMillis;
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
  }
  
  // Check WiFi status every 5 seconds
  if (currentMillis - prevWiFiCheckMillis >= wifiCheckInterval) {
    prevWiFiCheckMillis = currentMillis;
    checkWiFiStatus();
  }
  
  // Test network connectivity every 10 seconds
  if (currentMillis - prevNetworkTestMillis >= 10000) {
    prevNetworkTestMillis = currentMillis;
    testNetworkConnectivity();
  }
  
  // NEW: Regular buzzer beep every 10 seconds
  if (currentMillis - prevBuzzerMillis >= buzzerInterval) {
    prevBuzzerMillis = currentMillis;
    // Single beep to indicate system is running
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);  // Short beep
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("🔔 Regular system beep - Kishan Setu active");
  }
  
  // Read sensors
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  gasRaw = analogRead(MQ135PIN);
  
  // Handle sensor reading errors
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    temperature = 0.0;
    humidity = 0.0;
  }
  
  // Update gas level status
  if (gasRaw < GAS_THRESHOLD) {
    gasLevel = "Normal";
    environmentStatus = "Normal Environment";
  } else {
    gasLevel = "Hazardous";
    environmentStatus = "Hazardous Environment";
  }
  
  // Hazard buzzer alert (overrides regular beep)
  if (gasRaw > GAS_THRESHOLD) {
    if ((currentMillis / 500) % 2 == 0) {
      digitalWrite(BUZZER_PIN, HIGH);
    } else {
      digitalWrite(BUZZER_PIN, LOW);
    }
  } else {
    // Only turn off buzzer if not in regular beep timing
    if (currentMillis - prevBuzzerMillis > 100) {
      digitalWrite(BUZZER_PIN, LOW);
    }
  }
  
  // Update OLED display
  updateOLEDDisplay();
  
  // Send LoRa data
  if (currentMillis - prevLoRaMillis >= loraInterval) {
    prevLoRaMillis = currentMillis;
    sendLoRaData(temperature, humidity, gasRaw, gasLevel);
  }
  
  // Log to SD card
  logDataToSD();
  
  Serial.printf("Temp: %.1f C, Humidity: %.1f %%, Gas: %d ppm (%s) - %s\n", 
                temperature, humidity, gasRaw, gasLevel.c_str(), environmentStatus.c_str());
  
  delay(500);
}

void printNetworkDiagnostics() {
  Serial.println("=== NETWORK DIAGNOSTICS ===");
  Serial.println("ESP32 IP: " + WiFi.localIP().toString());
  Serial.println("Gateway IP: " + WiFi.gatewayIP().toString());
  Serial.println("Subnet Mask: " + WiFi.subnetMask().toString());
  Serial.println("DNS 1: " + WiFi.dnsIP(0).toString());
  Serial.println("DNS 2: " + WiFi.dnsIP(1).toString());
  Serial.println("MAC Address: " + WiFi.macAddress());
  Serial.println("RSSI: " + String(WiFi.RSSI()) + " dBm");
  Serial.println("Channel: " + String(WiFi.channel()));
  Serial.println("===========================");
}

void testNetworkConnectivity() {
  Serial.println("=== NETWORK CONNECTIVITY TEST ===");
  
  // Check if ESP32 can reach gateway
  IPAddress gateway = WiFi.gatewayIP();
  Serial.println("Gateway: " + gateway.toString());
  
  // Print current connections
  Serial.println("ESP32 IP: " + espIP);
  Serial.println("WiFi Status: " + wifiStatus);
  Serial.println("Signal Strength: " + String(WiFi.RSSI()) + " dBm");
  
  Serial.println("================================");
}

// Kishan Setu Welcome Page with 5-Second Countdown
void handleKishanSetuPage() {
  // Add CORS headers for cross-device access
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Cache-Control", "no-cache");
  
  // Check if request is for sensor API
  if (server.uri() == "/api/sensors") {
    return; // Don't redirect API calls
  }
  
  // Log incoming request for debugging
  Serial.println("Request from: " + server.client().remoteIP().toString());
  Serial.println("Requested URI: " + server.uri());
  Serial.println("User Agent: " + server.header("User-Agent"));
  
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Kishan Setu</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 30%, #66BB6A 70%, #43A047 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            overflow: hidden;
        }
        .container { 
            max-width: 700px; 
            width: 100%;
            background: rgba(255,255,255,0.15); 
            padding: 50px 40px; 
            border-radius: 25px; 
            box-shadow: 0 15px 40px rgba(0,0,0,0.2);
            backdrop-filter: blur(15px);
            border: 2px solid rgba(255,255,255,0.2);
            text-align: center;
            position: relative;
        }
        .welcome-header {
            margin-bottom: 40px;
        }
        .welcome-header h1 {
            font-size: 36px;
            margin-bottom: 15px;
            color: #E8F5E8;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            letter-spacing: 1px;
        }
        .welcome-header .subtitle {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 10px;
            color: #C8E6C9;
        }
        .hindi-text {
            font-size: 16px;
            color: #A5D6A7;
            font-style: italic;
            margin-bottom: 20px;
        }
        .farmer-icon {
            font-size: 60px;
            margin: 20px 0;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        .countdown-circle {
            width: 140px;
            height: 140px;
            border: 8px solid rgba(255,255,255,0.3);
            border-top: 8px solid #81C784;
            border-radius: 50%;
            margin: 30px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: spin 1s linear infinite;
            background: rgba(255,255,255,0.1);
        }
        .countdown-number {
            font-size: 54px;
            font-weight: bold;
            color: #E8F5E8;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .sensor-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        .sensor-card {
            background: rgba(255,255,255,0.15);
            padding: 25px 15px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.25);
            transition: transform 0.3s ease;
        }
        .sensor-card:hover {
            transform: translateY(-5px);
        }
        .sensor-icon {
            font-size: 36px;
            margin-bottom: 12px;
        }
        .sensor-value {
            font-size: 22px;
            font-weight: bold;
            margin: 10px 0;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        .sensor-label {
            font-size: 13px;
            opacity: 0.9;
            color: #C8E6C9;
        }
        .status-normal { color: #A5D6A7; }
        .status-warning { color: #FFD54F; }
        .status-danger { color: #EF5350; }
        .redirect-info {
            background: rgba(255,255,255,0.15);
            padding: 20px;
            border-radius: 15px;
            margin: 30px 0;
            border-left: 5px solid #81C784;
        }
        .redirect-info h3 {
            color: #E8F5E8;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .redirect-info p {
            color: #C8E6C9;
            margin: 5px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid rgba(255,255,255,0.2);
            font-size: 14px;
            opacity: 0.9;
            color: #C8E6C9;
        }
        .connection-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.1);
            padding: 8px 15px;
            border-radius: 20px;
            margin: 5px;
            font-size: 13px;
        }
        .loading-dots {
            display: inline-block;
            position: relative;
            width: 20px;
            height: 20px;
        }
        .loading-dots div {
            position: absolute;
            top: 8px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #81C784;
            animation: loading-dots 1.2s linear infinite;
        }
        .loading-dots div:nth-child(1) { left: 2px; animation-delay: 0s; }
        .loading-dots div:nth-child(2) { left: 8px; animation-delay: -0.4s; }
        .loading-dots div:nth-child(3) { left: 14px; animation-delay: -0.8s; }
        @keyframes loading-dots {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
    </style>
    <script>
        let countdown = 5;
        
        function updateCountdown() {
            document.getElementById('countdown').textContent = countdown;
            document.getElementById('countdown-text').textContent = countdown;
            
            if (countdown > 0) {
                countdown--;
                setTimeout(updateCountdown, 1000);
            } else {
                document.getElementById('countdown').textContent = '🚀';
                document.querySelector('.countdown-circle').style.borderTopColor = '#4CAF50';
                document.querySelector('.redirect-info h3').textContent = 'Opening Kishan Setu Platform...';
                setTimeout(function() {
                    window.location.href = 'http://172.20.10.2:8080/';
                }, 800);
            }
        }
        
        // Update sensor data every 2 seconds
        function updateSensorData() {
            fetch('/api/sensors')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('temp-value').textContent = data.temperature.toFixed(1) + '°C';
                    document.getElementById('humidity-value').textContent = data.humidity.toFixed(1) + '%';
                    document.getElementById('gas-value').textContent = data.gasRaw;
                    
                    const gasStatus = document.getElementById('gas-status');
                    gasStatus.textContent = data.gasLevel;
                    gasStatus.className = data.gasLevel === 'Hazardous' ? 'status-danger' : 'status-normal';
                    
                    document.getElementById('wifi-status').textContent = data.wifiConnected ? '✅ Connected' : '❌ Disconnected';
                    document.getElementById('esp-ip').textContent = data.espIP;
                })
                .catch(error => {
                    console.log('Sensor update failed:', error);
                });
        }
        
        // Start countdown and sensor updates
        window.onload = function() {
            updateCountdown();
            updateSensorData();
            setInterval(updateSensorData, 2000);
        }
    </script>
</head>
<body>
    <div class="container">
        <div class="welcome-header">
            <div class="farmer-icon">🌾</div>
            <h1>Welcome to Kishan Setu</h1>
            <p class="subtitle">Smart Agriculture IoT Platform</p>
            <p class="hindi-text">किसान सेतु - स्मार्ट कृषि प्लेटफॉर्म</p>
        </div>
        
        <div class="countdown-circle">
            <div class="countdown-number" id="countdown">5</div>
        </div>
        
        <div class="redirect-info">
            <h3>🚀 Loading Platform...</h3>
            <p>Redirecting to Kishan Setu in <strong><span id="countdown-text">5</span></strong> seconds</p>
            <div class="loading-dots">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
        
        <div class="sensor-grid">
            <div class="sensor-card">
                <div class="sensor-icon">🌡️</div>
                <div class="sensor-value" id="temp-value">)rawliteral" + String(temperature, 1) + R"rawliteral(°C</div>
                <div class="sensor-label">Temperature</div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">💧</div>
                <div class="sensor-value" id="humidity-value">)rawliteral" + String(humidity, 1) + R"rawliteral(%</div>
                <div class="sensor-label">Humidity</div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">🌬️</div>
                <div class="sensor-value" id="gas-value">)rawliteral" + String(gasRaw) + R"rawliteral(</div>
                <div class="sensor-label">Air Quality (ppm)</div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">🔍</div>
                <div class="sensor-value">
                    <span id="gas-status" class=")rawliteral" + (gasLevel == "Hazardous" ? "status-danger" : "status-normal") + R"rawliteral(">)rawliteral" + gasLevel + R"rawliteral(</span>
                </div>
                <div class="sensor-label">Environment Status</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="connection-status">
                <span>📡</span>
                <span id="wifi-status">)rawliteral" + (wifiConnected ? "✅ Connected" : "❌ Disconnected") + R"rawliteral(</span>
            </div>
            <div class="connection-status">
                <span>🌐</span>
                <span id="esp-ip">)rawliteral" + espIP + R"rawliteral(</span>
            </div>
            <div class="connection-status">
                <span>📶</span>
                <span>)rawliteral" + String(wifi_ssid) + R"rawliteral(</span>
            </div>
            <p style="margin-top: 20px;">🌾 Empowering Farmers with Smart Technology</p>
        </div>
    </div>
</body>
</html>
)rawliteral";
  
  server.send(200, "text/html", html);
  Serial.println("Kishan Setu page served to: " + server.client().remoteIP().toString());
}

void checkWiFiStatus() {
  // Check WiFi connection
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    espIP = WiFi.localIP().toString();
    wifiStatus = "Connected to " + String(wifi_ssid);
  } else {
    wifiConnected = false;
    espIP = "Disconnected";
    wifiStatus = "Connection lost";
    
    // Try to reconnect
    Serial.println("Attempting to reconnect...");
    WiFi.begin(wifi_ssid, wifi_password);
  }
  
  // Serial output
  Serial.println("=== Kishan Setu Status ===");
  Serial.print("Network: ");
  Serial.println(wifiConnected ? "Connected ✅" : "Disconnected ❌");
  Serial.println("ESP32 IP: " + espIP);
  Serial.println("Connected to: " + String(wifi_ssid));
  Serial.println("Status: " + wifiStatus);
  Serial.println("=========================");
}

void handleSensorAPI() {
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  String json = "{";
  json += "\"temperature\":" + String(temperature, 1) + ",";
  json += "\"humidity\":" + String(humidity, 1) + ",";
  json += "\"gasRaw\":" + String(gasRaw) + ",";
  json += "\"gasLevel\":\"" + gasLevel + "\",";
  json += "\"environmentStatus\":\"" + environmentStatus + "\",";
  json += "\"wifiConnected\":" + String(wifiConnected ? "true" : "false") + ",";
  json += "\"wifiStatus\":\"" + wifiStatus + "\",";
  json += "\"espIP\":\"" + espIP + "\",";
  json += "\"clientIP\":\"" + server.client().remoteIP().toString() + "\",";
  json += "\"gateway\":\"" + WiFi.gatewayIP().toString() + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI());
  json += "}";
  
  server.send(200, "application/json", json);
  
  Serial.println("Kishan Setu Sensor API called by: " + server.client().remoteIP().toString());
}

void updateOLEDDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  
  display.println("Kishan Setu Portal");
  display.println("Visit: " + espIP);
  display.println("");
  
  // WiFi Status Display
  if (wifiConnected) {
    display.println("WiFi: Connected");
    display.println("Network: " + String(wifi_ssid));
  } else {
    display.println("WiFi: Disconnected");
    display.println("Network: " + String(wifi_ssid));
  }
  
  // Sensor data
  if (temperature > 0 && humidity > 0) {
    display.printf("T:%.1fC H:%.1f%%\n", temperature, humidity);
  } else {
    display.println("Sensors: Error");
  }
  
  display.printf("Air: %s\n", gasLevel.c_str());
  
  // Danger alert if needed
  if (gasRaw > GAS_THRESHOLD) {
    display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
    display.println("ALERT!");
    display.setTextColor(SSD1306_WHITE);
  }
  
  display.display();
}

void logDataToSD() {
  File dataFile = SD.open("kishan_setu_data.txt", FILE_APPEND);
  if (dataFile) {
    dataFile.printf("Temp: %.2f, Humidity: %.2f, Gas: %d ppm, Level: %s, Status: %s, IP: %s, RSSI: %d\n",
                    temperature,
                    humidity,
                    gasRaw,
                    gasLevel.c_str(),
                    wifiStatus.c_str(),
                    espIP.c_str(),
                    WiFi.RSSI());
    dataFile.close();
  }
}

void sendLoRaData(float temp, float hum, int gas, String level) {
  String packet = "{";
  packet += "\"platform\":\"kishan_setu\",";
  packet += "\"temp\":" + String(temp, 1) + ",";
  packet += "\"humidity\":" + String(hum, 1) + ",";
  packet += "\"gas\":" + String(gas) + ",";
  packet += "\"level\":\"" + level + "\",";
  packet += "\"wifi\":" + String(wifiConnected ? "true" : "false") + ",";
  packet += "\"ip\":\"" + espIP + "\",";
  packet += "\"rssi\":" + String(WiFi.RSSI());
  packet += "}";
  
  LoRa.beginPacket();
  LoRa.print(packet);
  LoRa.endPacket();
  
  Serial.println("Kishan Setu LoRa data sent: " + packet);
}
