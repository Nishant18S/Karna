import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import SubsidyCalculator from "./components/SubsidyCalculator";
import ProductsManager from "./components/ProductsManager";
import ProductUpload from "./components/ProductUpload";
import Marketplace from "./components/Marketplace";
import AISchemes from "./components/AISchemes";
import Modal from "./components/Modal";
import { User, ModalContent } from "./types";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = () => {
      try {
        const farmerName = sessionStorage.getItem("farmerName");
        const farmerData = sessionStorage.getItem("farmerData");

        if (farmerName) {
          const userData = farmerData
            ? JSON.parse(farmerData)
            : {
                name: farmerName,
                landSize: 3.2,
                annualIncome: 250000,
                
                aadhaar: sessionStorage.getItem('aadhaars') || "123456789012",
              };

          setCurrentUser(userData);
          setIsAuthenticated(true);
        } else {
          // If not authenticated, redirect to login.html
          window.location.href = "/login.html";
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        window.location.href = "/login.html";
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Create floating particles only after authentication
    if (isAuthenticated) {
      createParticles();
    }
  }, [isAuthenticated]);

  const createParticles = () => {
    const particles = document.getElementById("particles");
    if (!particles) return;

    // Clear existing particles
    particles.innerHTML = "";

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";
      particle.style.width = particle.style.height =
        Math.random() * 10 + 5 + "px";
      particle.style.animationDelay = Math.random() * 6 + "s";
      particle.style.animationDuration = Math.random() * 3 + 3 + "s";
      particles.appendChild(particle);
    }
  };

  const showModal = (content: ModalContent) => {
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      sessionStorage.clear();
      // Redirect to login page after logout
      window.location.href = "/login.html";
    }
  };

  // In your App.tsx, update the renderTabContent function
  const renderTabContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case "dashboard":
        return <Dashboard currentUser={currentUser} />;
      case "subsidy":
        return (
          <SubsidyCalculator currentUser={currentUser} showModal={showModal} />
        );
      case "products":
        return (
          <ProductsManager
            currentUser={currentUser}
            showModal={showModal}
          />
        );
      case "upload":
        return (
          <ProductUpload
            currentUser={currentUser}
            onSuccess={() => setActiveTab("products")}
          />
        );
      case "marketplace":
        return <Marketplace showModal={showModal} />;
      case "ai-schemes":
        return <AISchemes currentUser={currentUser} />;
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, this won't render as we redirect to login.html
  return (
    <div className="app">
      <div id="particles"></div>

      {currentUser && (
        <Header currentUser={currentUser} onLogout={handleLogout} />
      )}

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} currentUser={currentUser} />

      <main className="main-content">{renderTabContent()}</main>

      {modalContent && <Modal content={modalContent} onClose={closeModal} />}
    </div>
  );
}

export default App;
