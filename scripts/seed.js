/**
 * MigrantShield Seed Script
 * Usage: node scripts/seed.js
 * Requires a running MongoDB instance. Set MONGODB_URI in .env or environment.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models directly (bypassing server.js)
const User = require('../backend/models/User');
const WelfareScheme = require('../backend/models/WelfareScheme');
const WageReference = require('../backend/models/WageReference');
const Skill = require('../backend/models/Skill');

const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/migrantshield';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected.');

  // ─── Clean existing seed data ─────────────────────────────────────────────
  console.log('Clearing existing seed collections...');
  await Promise.all([
    WelfareScheme.deleteMany({}),
    WageReference.deleteMany({}),
    Skill.deleteMany({}),
    User.deleteMany({ email: { $in: ['admin@migrantshield.gov.in', 'officer@migrantshield.gov.in'] } }),
  ]);

  // ─── Welfare Schemes ──────────────────────────────────────────────────────
  console.log('Seeding welfare schemes...');
  const schemes = [
    {
      schemeName: 'Pradhan Mantri Awas Yojana (PMAY)',
      department: 'Ministry of Housing and Urban Affairs',
      state: 'central',
      eligibility: {
        minAge: 18,
        maxAge: 65,
        maxIncome: 300000,
        sectors: ['all'],
      },
      requiredDocuments: ['Aadhaar Card', 'Income Certificate', 'Bank Passbook', 'Domicile Certificate'],
      benefits:
        'Financial assistance up to ₹2.67 lakh for construction/purchase of a house under various components (EWS/LIG/MIG).',
      applicationProcedure:
        'Apply through pmaymis.gov.in or visit nearest PMAY cell in ULB/Gram Panchayat.',
      officialSource: 'https://pmaymis.gov.in',
      effectiveDate: new Date('2015-06-25'),
      lastUpdated: new Date('2023-01-01'),
      isActive: true,
    },
    {
      schemeName: 'Employees State Insurance (ESIC)',
      department: "Employees' State Insurance Corporation",
      state: 'central',
      eligibility: {
        minAge: 14,
        maxAge: 60,
        maxIncome: 216000,
        sectors: ['construction', 'manufacturing', 'textile', 'logistics', 'hospitality'],
      },
      requiredDocuments: ['Aadhaar Card', 'Employer Registration Certificate', 'Bank Passbook'],
      benefits:
        'Medical care, cash benefits during sickness/maternity, disablement benefit, and dependants\' benefit. Covers worker and family.',
      applicationProcedure:
        'Employer registers on esic.gov.in. Employee gets ESIC card. Visit nearest ESIC dispensary for medical benefits.',
      officialSource: 'https://esic.gov.in',
      effectiveDate: new Date('1952-02-24'),
      lastUpdated: new Date('2023-06-01'),
      isActive: true,
    },
    {
      schemeName: 'Building and Other Construction Workers (BOCW) Welfare Scheme',
      department: 'Ministry of Labour and Employment',
      state: 'central',
      eligibility: {
        minAge: 18,
        maxAge: 60,
        maxIncome: 500000,
        occupations: ['Mason', 'Welder', 'Carpenter', 'Electrician', 'Plumber', 'Helper'],
        sectors: ['construction'],
      },
      requiredDocuments: [
        'Aadhaar Card', 'Proof of employment as construction worker (90 days minimum)',
        'Bank Passbook', 'Age proof',
      ],
      benefits:
        'Pension, medical assistance, maternity benefit, education assistance for children, accident benefit, housing loan, and funeral assistance.',
      applicationProcedure:
        'Register with the State BOCW Welfare Board. Apply through respective state portal or local labour office.',
      officialSource: 'https://labour.gov.in/bocw',
      effectiveDate: new Date('1996-08-01'),
      lastUpdated: new Date('2023-03-01'),
      isActive: true,
    },
    {
      schemeName: 'Pradhan Mantri Jan Arogya Yojana (PM-JAY / Ayushman Bharat)',
      department: 'National Health Authority, Ministry of Health',
      state: 'central',
      eligibility: {
        minAge: 0,
        maxAge: 100,
        maxIncome: 200000,
        sectors: ['all'],
      },
      requiredDocuments: [
        'Aadhaar Card', 'Ration Card (SECC-listed family)', 'Ayushman Bharat Golden Card',
      ],
      benefits:
        'Health cover of ₹5 lakh per family per year for secondary and tertiary hospitalization at empanelled public and private hospitals.',
      applicationProcedure:
        'Check eligibility on pmjay.gov.in using Aadhaar or ration card. Visit Common Service Centre or Ayushman Mitra at empanelled hospital.',
      officialSource: 'https://pmjay.gov.in',
      effectiveDate: new Date('2018-09-23'),
      lastUpdated: new Date('2023-09-01'),
      isActive: true,
    },
    {
      schemeName: 'National Scholarship Portal (Post-Matric Scholarship for OBC)',
      department: 'Ministry of Social Justice and Empowerment',
      state: 'central',
      eligibility: {
        minAge: 15,
        maxAge: 35,
        maxIncome: 100000,
        sectors: ['all'],
      },
      requiredDocuments: [
        'Aadhaar Card', 'OBC Certificate', 'Income Certificate',
        'Previous Year Marksheet', 'Bank Passbook',
      ],
      benefits:
        'Maintenance allowance and course fee reimbursement for OBC students pursuing post-matriculation education.',
      applicationProcedure:
        'Apply online at scholarships.gov.in before the deadline. Upload required documents.',
      officialSource: 'https://scholarships.gov.in',
      effectiveDate: new Date('2014-04-01'),
      lastUpdated: new Date('2023-07-01'),
      isActive: true,
    },
  ];

  await WelfareScheme.insertMany(schemes);
  console.log(`✓ Inserted ${schemes.length} welfare schemes`);

  // ─── Wage References ───────────────────────────────────────────────────────
  console.log('Seeding wage references...');
  const wageRefs = [
    // Gujarat — Construction
    {
      occupation: 'Mason',
      sector: 'construction',
      state: 'Gujarat',
      district: 'Ahmedabad',
      skillLevel: 'skilled',
      minimumWage: 550,
      wageUnit: 'daily',
      workingHoursAssumption: 8,
      overtimeMultiplier: 2.0,
      effectiveDate: new Date('2023-04-01'),
      source: 'Gujarat Labour Department Notification 2023',
      isActive: true,
    },
    {
      occupation: 'Helper / Unskilled Worker',
      sector: 'construction',
      state: 'Gujarat',
      district: 'Surat',
      skillLevel: 'unskilled',
      minimumWage: 340,
      wageUnit: 'daily',
      workingHoursAssumption: 8,
      overtimeMultiplier: 2.0,
      effectiveDate: new Date('2023-04-01'),
      source: 'Gujarat Labour Department Notification 2023',
      isActive: true,
    },
    // Gujarat — Diamond
    {
      occupation: 'Diamond Polisher',
      sector: 'diamond',
      state: 'Gujarat',
      district: 'Surat',
      skillLevel: 'skilled',
      minimumWage: 650,
      wageUnit: 'daily',
      workingHoursAssumption: 8,
      overtimeMultiplier: 2.0,
      effectiveDate: new Date('2023-04-01'),
      source: 'Gujarat Diamond Workers Union Reference 2023',
      isActive: true,
    },
    {
      occupation: 'Diamond Polisher (Trainee)',
      sector: 'diamond',
      state: 'Gujarat',
      district: 'Surat',
      skillLevel: 'semi-skilled',
      minimumWage: 420,
      wageUnit: 'daily',
      workingHoursAssumption: 8,
      overtimeMultiplier: 2.0,
      effectiveDate: new Date('2023-04-01'),
      source: 'Gujarat Diamond Workers Union Reference 2023',
      isActive: true,
    },
    // Gujarat — Textile
    {
      occupation: 'Textile Machine Operator',
      sector: 'textile',
      state: 'Gujarat',
      district: 'Surat',
      skillLevel: 'semi-skilled',
      minimumWage: 9800,
      wageUnit: 'monthly',
      workingHoursAssumption: 8,
      overtimeMultiplier: 2.0,
      effectiveDate: new Date('2023-10-01'),
      source: 'Gujarat Minimum Wages Act Notification October 2023',
      isActive: true,
    },
    {
      occupation: 'Weaver',
      sector: 'textile',
      state: 'Gujarat',
      district: 'Surat',
      skillLevel: 'skilled',
      minimumWage: 12500,
      wageUnit: 'monthly',
      workingHoursAssumption: 8,
      overtimeMultiplier: 2.0,
      effectiveDate: new Date('2023-10-01'),
      source: 'Gujarat Minimum Wages Act Notification October 2023',
      isActive: true,
    },
    // Bihar — Construction
    {
      occupation: 'Mason',
      sector: 'construction',
      state: 'Bihar',
      district: 'Patna',
      skillLevel: 'skilled',
      minimumWage: 445,
      wageUnit: 'daily',
      workingHoursAssumption: 8,
      overtimeMultiplier: 2.0,
      effectiveDate: new Date('2023-04-01'),
      source: 'Bihar Labour Department Notification 2023',
      isActive: true,
    },
    {
      occupation: 'Helper / Unskilled Worker',
      sector: 'construction',
      state: 'Bihar',
      skillLevel: 'unskilled',
      minimumWage: 290,
      wageUnit: 'daily',
      workingHoursAssumption: 8,
      overtimeMultiplier: 2.0,
      effectiveDate: new Date('2023-04-01'),
      source: 'Bihar Labour Department Notification 2023',
      isActive: true,
    },
    // Bihar — Agriculture
    {
      occupation: 'Agricultural Worker',
      sector: 'agriculture',
      state: 'Bihar',
      skillLevel: 'unskilled',
      minimumWage: 267,
      wageUnit: 'daily',
      workingHoursAssumption: 8,
      overtimeMultiplier: 1.5,
      effectiveDate: new Date('2023-04-01'),
      source: 'Bihar Minimum Wages Act 2023',
      isActive: true,
    },
    // Rajasthan — Textile
    {
      occupation: 'Textile Helper',
      sector: 'textile',
      state: 'Rajasthan',
      district: 'Jaipur',
      skillLevel: 'unskilled',
      minimumWage: 8500,
      wageUnit: 'monthly',
      workingHoursAssumption: 8,
      overtimeMultiplier: 2.0,
      effectiveDate: new Date('2023-07-01'),
      source: 'Rajasthan Minimum Wages Notification July 2023',
      isActive: true,
    },
  ];

  await WageReference.insertMany(wageRefs);
  console.log(`✓ Inserted ${wageRefs.length} wage references`);

  // ─── Skills ────────────────────────────────────────────────────────────────
  console.log('Seeding skills...');
  const skills = [
    {
      skillName: 'Diamond Polishing',
      category: 'Gem and Jewellery',
      sector: 'diamond',
      level: 'advanced',
      requiredExperience: 2,
      certificationRequired: false,
      description:
        'Cutting and polishing of rough diamonds using bruting, sawing, and faceting techniques on polishing wheels (tandoor).',
    },
    {
      skillName: 'Textile Machine Operation',
      category: 'Textile and Garments',
      sector: 'textile',
      level: 'intermediate',
      requiredExperience: 1,
      certificationRequired: false,
      description:
        'Operating power loom, ring frame, or knitting machines; setting up yarn, monitoring tension, and rectifying fabric defects.',
    },
    {
      skillName: 'Masonry',
      category: 'Construction',
      sector: 'construction',
      level: 'intermediate',
      requiredExperience: 2,
      certificationRequired: false,
      description:
        'Bricklaying, plastering, flooring, and finishing work in building construction as per IS codes.',
    },
    {
      skillName: 'Welding (Arc/MIG)',
      category: 'Construction and Manufacturing',
      sector: 'construction',
      level: 'advanced',
      requiredExperience: 3,
      certificationRequired: true,
      description:
        'Shielded Metal Arc Welding (SMAW) and MIG/MAG welding of structural steel. NCVT certification preferred.',
    },
    {
      skillName: 'General Helper',
      category: 'General Labour',
      sector: 'other',
      level: 'beginner',
      requiredExperience: 0,
      certificationRequired: false,
      description:
        'Unskilled assistance in loading/unloading, material handling, cleaning, and site support across industries.',
    },
  ];

  await Skill.insertMany(skills);
  console.log(`✓ Inserted ${skills.length} skills`);

  // ─── Admin & Officer Users ─────────────────────────────────────────────────
  console.log('Seeding users...');

  // Manually hash — bypassing the pre-save hook which fires on .save() not insertMany
  const adminPass = await bcrypt.hash('Admin@1234', 12);
  const officerPass = await bcrypt.hash('Officer@1234', 12);

  const users = [
    {
      name: 'System Admin',
      email: 'admin@migrantshield.gov.in',
      mobile: '9000000001',
      password: adminPass,
      role: 'admin',
      isVerified: true,
      isActive: true,
    },
    {
      name: 'Labour Officer Ravi Kumar',
      email: 'officer@migrantshield.gov.in',
      mobile: '9000000002',
      password: officerPass,
      role: 'labor_officer',
      isVerified: true,
      isActive: true,
    },
  ];

  await User.insertMany(users);
  console.log(`✓ Inserted ${users.length} users`);

  console.log('\n✅ Seeding complete!');
  console.log('   Admin     : admin@migrantshield.gov.in / Admin@1234');
  console.log('   Officer   : officer@migrantshield.gov.in / Officer@1234');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
