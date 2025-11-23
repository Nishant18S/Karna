const mongoose = require('mongoose');

// Emergency Schema
const emergencySchema = new mongoose.Schema({
  emergency_id: { type: String, required: true, unique: true },
  user_name: { type: String, required: true },
  mobile_number: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: Number
  },
  address: String,
  emergency_type: { 
    type: String, 
    required: true,
    enum: ['medical', 'police', 'fire', 'accident', 'other']
  },
  description: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'cancelled'],
    default: 'pending'
  },
  department: {
    type: String,
    enum: ['police', 'medical', 'fire', 'multi', 'pending'],
    default: 'pending'
  },
  assigned_units: [{
    unit_type: String,
    unit_id: String,
    assigned_at: { type: Date, default: Date.now }
  }],
  response_time: Number,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  department: { 
    type: String, 
    required: true,
    enum: ['police', 'medical', 'fire', 'superadmin']
  },
  phone: String,
  email: String,
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// Emergency Log Schema
const emergencyLogSchema = new mongoose.Schema({
  emergency_id: { type: String, required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'emergency_created', 
      'status_updated', 
      'department_assigned', 
      'unit_dispatched', 
      'response_completed'
    ]
  },
  department: String,
  admin_name: String,
  notes: String,
  created_at: { type: Date, default: Date.now }
});

// Response Unit Schema
const responseUnitSchema = new mongoose.Schema({
  unit_id: { type: String, required: true, unique: true },
  unit_type: { 
    type: String, 
    required: true,
    enum: ['police_car', 'ambulance', 'fire_truck', 'rescue_team']
  },
  department: { 
    type: String, 
    required: true,
    enum: ['police', 'medical', 'fire']
  },
  unit_name: String,
  current_location: {
    latitude: Number,
    longitude: Number
  },
  status: {
    type: String,
    enum: ['available', 'dispatched', 'busy', 'offline'],
    default: 'available'
  },
  assigned_emergency: String,
  last_updated: { type: Date, default: Date.now }
});

// Create indexes
emergencySchema.index({ emergency_id: 1 });
emergencySchema.index({ status: 1 });
emergencySchema.index({ created_at: -1 });
emergencySchema.index({ department: 1 });

adminSchema.index({ username: 1 });
adminSchema.index({ department: 1 });

emergencyLogSchema.index({ emergency_id: 1 });
emergencyLogSchema.index({ created_at: -1 });

responseUnitSchema.index({ unit_id: 1 });
responseUnitSchema.index({ status: 1 });
responseUnitSchema.index({ department: 1 });

const Emergency = mongoose.model('Emergency', emergencySchema);
const Admin = mongoose.model('Admin', adminSchema);
const EmergencyLog = mongoose.model('EmergencyLog', emergencyLogSchema);
const ResponseUnit = mongoose.model('ResponseUnit', responseUnitSchema);

// Create default admin accounts
const createDefaultAdmins = async () => {
  try {
    const admins = [
      {
        username: 'superadmin',
        password: 'admin123',
        name: 'Super Administrator',
        department: 'superadmin',
        phone: '+911234567890',
        email: 'superadmin@instanthelp.com'
      },
      {
        username: 'police_admin',
        password: 'police123',
        name: 'Police Department Admin',
        department: 'police',
        phone: '+911234567891',
        email: 'police@instanthelp.com'
      },
      {
        username: 'medical_admin',
        password: 'medical123',
        name: 'Medical Department Admin',
        department: 'medical',
        phone: '+911234567892',
        email: 'medical@instanthelp.com'
      },
      {
        username: 'fire_admin',
        password: 'fire123',
        name: 'Fire Department Admin',
        department: 'fire',
        phone: '+911234567893',
        email: 'fire@instanthelp.com'
      }
    ];

    for (const adminData of admins) {
      const existingAdmin = await Admin.findOne({ username: adminData.username });
      if (!existingAdmin) {
        await Admin.create(adminData);
        console.log(`✅ Created admin: ${adminData.username}`);
      }
    }
  } catch (error) {
    console.error('Error creating default admins:', error);
  }
};

// Create default response units
const createDefaultResponseUnits = async () => {
  try {
    const units = [
      {
        unit_id: 'AMB001',
        unit_name: 'Ambulance 1',
        unit_type: 'ambulance',
        department: 'medical',
        current_location: { latitude: 20.2961, longitude: 85.8245 },
        status: 'available'
      },
      {
        unit_id: 'POL001',
        unit_name: 'Police Car 1',
        unit_type: 'police_car',
        department: 'police',
        current_location: { latitude: 20.2961, longitude: 85.8245 },
        status: 'available'
      },
      {
        unit_id: 'FIR001',
        unit_name: 'Fire Truck 1',
        unit_type: 'fire_truck',
        department: 'fire',
        current_location: { latitude: 20.2961, longitude: 85.8245 },
        status: 'available'
      }
    ];

    for (const unitData of units) {
      const existingUnit = await ResponseUnit.findOne({ unit_id: unitData.unit_id });
      if (!existingUnit) {
        await ResponseUnit.create(unitData);
        console.log(`✅ Created response unit: ${unitData.unit_id}`);
      }
    }
  } catch (error) {
    console.error('Error creating default response units:', error);
  }
};

// Initialize default data
createDefaultAdmins();
createDefaultResponseUnits();

module.exports = {
  Emergency,
  Admin,
  EmergencyLog,
  ResponseUnit
};