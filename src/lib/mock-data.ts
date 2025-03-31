import { CollectionItem, ConfidenceScore, PriceEstimate, User } from "../types/collection";
import { v4 as uuidv4 } from 'uuid';

// Mock users
const mockUsers: User[] = [
  {
    id: "user1",
    email: "collector@example.com",
    name: "Alex Collector",
    collections: []
  }
];

// Mock collection items
const mockCollections: CollectionItem[] = [
  {
    id: "item1",
    userId: "user1",
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    status: 'active',
    
    category: "Coins",
    
    name: "1909-S VDB Lincoln Cent",
    type: "Coin",
    manufacturer: "U.S. Mint",
    yearProduced: "1909",
    edition: "S VDB",
    modelNumber: "N/A",
    uniqueIdentifiers: "VDB initials on reverse",
    
    condition: "Very Fine (VF-20)",
    flaws: "Light scratches on obverse, slight discoloration",
    completeness: "Complete",
    
    acquisitionSource: "Heritage Auctions",
    previousOwners: "Private collector in San Francisco",
    documentation: "Certificate of Authenticity included",
    
    images: [
      "https://images.unsplash.com/photo-1604250401002-e5d4fea3ead7?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=400&h=300",
    ],
    videos: [],
    
    dimensions: "19mm diameter",
    weight: "3.11g",
    
    rarity: "Very Rare (mintage of 484,000)",
    priceEstimate: {
      low: 900,
      average: 1200,
      high: 1500,
      marketValue: 1350
    },
    confidenceScore: {
      score: 85,
      level: "high",
      factors: [
        { factor: "Category identified", impact: 10 },
        { factor: "Year range estimated", impact: 15 },
        { factor: "Condition assessed", impact: 20 },
        { factor: "Rarity determined", impact: 15 },
        { factor: "Market data available", impact: 18 }
      ]
    },
    
    primaryObject: {
      shape: "Round/Circular",
      colors: {
        dominant: "Copper/Bronze",
        accents: ["Brown toning"]
      },
      texture: "Smooth with fine details",
      material: "Copper",
      distinguishingFeatures: ["VDB initials on reverse", "S mintmark"],
      style: "US Coin",
      timePeriod: "Early 20th Century",
      function: "Currency",
      condition: "Very Fine",
    },
    
    notes: "One of the key dates in the Lincoln cent series. The 1909-S VDB is highly sought after due to its low mintage and the controversy surrounding the designer's initials."
  },
  {
    id: "item2",
    userId: "user1",
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    status: 'active',
    
    category: "Trading Cards",
    
    name: "Charizard Holographic Card",
    type: "Pokémon Trading Card",
    manufacturer: "Wizards of the Coast",
    yearProduced: "1999",
    edition: "Base Set",
    modelNumber: "4/102",
    uniqueIdentifiers: "Holographic, 1st Edition",
    
    condition: "Near Mint (PSA 8)",
    flaws: "Minor corner wear, slight holographic scratching",
    completeness: "Single card",
    
    acquisitionSource: "Card shop in Tokyo",
    previousOwners: "Original owner from childhood",
    documentation: "PSA grading case and certificate",
    
    images: [
      "https://images.unsplash.com/photo-1605979257913-1704eb7b6246?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=400&h=300",
    ],
    videos: [],
    
    dimensions: "2.5\" x 3.5\"",
    weight: "1.8g",
    
    rarity: "Rare",
    priceEstimate: {
      low: 15000,
      average: 20000,
      high: 25000,
      marketValue: 22500
    },
    confidenceScore: {
      score: 92,
      level: "high",
      factors: [
        { factor: "Category identified", impact: 10 },
        { factor: "Year range estimated", impact: 15 },
        { factor: "Condition assessed", impact: 20 },
        { factor: "Rarity determined", impact: 15 },
        { factor: "Market data available", impact: 18 }
      ]
    },
    
    primaryObject: {
      shape: "Rectangular",
      colors: {
        dominant: "Orange/Red",
        accents: ["Blue", "Yellow", "Holographic shine"]
      },
      texture: "Glossy with holographic pattern",
      material: "Cardstock with foil treatment",
      distinguishingFeatures: ["Holographic artwork", "1st Edition stamp", "Charizard artwork"],
      style: "Trading Card Game",
      timePeriod: "Late 1990s",
      function: "Collectible Game Piece",
      condition: "Near Mint",
    },
    
    notes: "One of the most iconic Pokémon cards ever created. The Charizard from the original Base Set remains highly sought after by collectors worldwide."
  },
  {
    id: "item3",
    userId: "user1",
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    status: 'active',
    
    category: "Action Figures",
    
    name: "Original Kenner Darth Vader",
    type: "Action Figure",
    manufacturer: "Kenner",
    yearProduced: "1978",
    edition: "Star Wars - A New Hope",
    modelNumber: "#39110",
    uniqueIdentifiers: "Telescoping Lightsaber Variant",
    
    condition: "Good",
    flaws: "Cape has some fraying, paint wear on helmet, lightsaber tip missing",
    completeness: "Missing original cardback packaging",
    
    acquisitionSource: "Estate sale",
    previousOwners: "Unknown",
    documentation: "None",
    
    images: [
      "https://images.unsplash.com/photo-1608889476561-6242cfdbf622?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=400&h=300",
    ],
    videos: [],
    
    dimensions: "3.75\" tall",
    weight: "50g",
    
    rarity: "Uncommon (rare variant)",
    priceEstimate: {
      low: 300,
      average: 600,
      high: 1200,
      marketValue: 800
    },
    confidenceScore: {
      score: 65,
      level: "medium",
      factors: [
        { factor: "Category identified", impact: 10 },
        { factor: "Year range estimated", impact: 15 },
        { factor: "Condition assessed", impact: 20 },
        { factor: "Rarity determined", impact: 15 },
        { factor: "Market data available", impact: 18 }
      ]
    },
    
    primaryObject: {
      shape: "Humanoid/Standing figure",
      colors: {
        dominant: "Black",
        accents: ["Silver", "Red"]
      },
      texture: "Plastic with cloth cape",
      material: "Injection-molded plastic and fabric",
      distinguishingFeatures: ["Telescoping lightsaber", "Black helmet", "Cape"],
      style: "Vintage Action Figure",
      timePeriod: "Late 1970s",
      function: "Toy/Collectible",
      condition: "Good with wear",
    },
    
    notes: "The telescoping lightsaber variant is among the most sought-after early Star Wars figures. Due to design flaws, the telescoping feature was quickly discontinued, making these early figures quite valuable."
  },
  {
    id: "item4",
    userId: "user1",
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    status: 'active',
    
    category: "Stamps",
    
    name: "Inverted Jenny",
    type: "Postage Stamp",
    manufacturer: "U.S. Post Office",
    yearProduced: "1918",
    edition: "24¢ Airmail",
    modelNumber: "N/A",
    uniqueIdentifiers: "Inverted airplane error",
    
    condition: "Very Fine (never hinged)",
    flaws: "Slight gum disturbance on reverse",
    completeness: "Single stamp",
    
    acquisitionSource: "Inherited from grandfather",
    previousOwners: "Family heirloom",
    documentation: "Letter of provenance, certificate of authenticity",
    
    images: [
      "https://images.unsplash.com/photo-1574144113084-b6f450cc5e0d?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=400&h=300",
    ],
    videos: [],
    
    dimensions: "25mm x 30mm",
    weight: "<1g",
    
    rarity: "Extremely Rare (only 100 known examples)",
    priceEstimate: {
      low: 500000,
      average: 650000,
      high: 850000,
      marketValue: 750000
    },
    confidenceScore: {
      score: 40,
      level: "low",
      factors: [
        { factor: "Category identified", impact: 10 },
        { factor: "Year range estimated", impact: 15 },
        { factor: "Condition assessed", impact: 20 },
        { factor: "Rarity determined", impact: 15 },
        { factor: "Market data available", impact: 18 }
      ]
    },
    
    primaryObject: {
      shape: "Rectangular with perforated edges",
      colors: {
        dominant: "Blue",
        accents: ["Red", "White"]
      },
      texture: "Paper with adhesive backing",
      material: "Engraved paper",
      distinguishingFeatures: ["Inverted airplane image", "Perforation pattern", "24¢ denomination"],
      style: "Postage Stamp",
      timePeriod: "Early 20th Century",
      function: "Postal/Collectible",
      condition: "Very Fine",
    },
    
    notes: "One of the world's most famous stamp errors. During printing, the Curtiss JN-4 airplane in the center was accidentally printed upside-down. Only one sheet of 100 stamps with this error was ever discovered."
  }
];

// Push mock collections to the mock user
mockUsers[0].collections = mockCollections;

// Set up localStorage if in browser environment
const initializeLocalStorage = () => {
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify(mockUsers));
    }
    if (!localStorage.getItem('collections')) {
      localStorage.setItem('collections', JSON.stringify(mockCollections));
    }
    if (!localStorage.getItem('currentUser')) {
      localStorage.setItem('currentUser', JSON.stringify(null));
    }
  }
};

// Get all users
export const getUsers = (): User[] => {
  initializeLocalStorage();
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
};

// Get current logged in user
export const getCurrentUser = (): User | null => {
  initializeLocalStorage();
  const currentUser = localStorage.getItem('currentUser');
  return currentUser ? JSON.parse(currentUser) : null;
};

// Set current user
export const setCurrentUser = (user: User | null): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// Login user
export const loginUser = (email: string, password: string): User | null => {
  // Simple mock authentication (in a real app, never handle passwords like this)
  const users = getUsers();
  const user = users.find(user => user.email === email);
  
  // For demo purposes, any password works
  if (user) {
    setCurrentUser(user);
    return user;
  }
  
  return null;
};

// Register user
export const registerUser = (email: string, name: string, password: string): User => {
  const users = getUsers();
  
  const newUser: User = {
    id: uuidv4(),
    email,
    name,
    collections: []
  };
  
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  setCurrentUser(newUser);
  
  return newUser;
};

// Logout user
export const logoutUser = (): void => {
  setCurrentUser(null);
};

// Get user's collection items
export const getUserCollections = (userId: string): CollectionItem[] => {
  initializeLocalStorage();
  const collections = localStorage.getItem('collections');
  const allCollections = collections ? JSON.parse(collections) : [];
  return allCollections.filter((item: CollectionItem) => item.userId === userId);
};

// Add a new collection item
export const addCollectionItem = (item: Omit<CollectionItem, 'id' | 'dateAdded' | 'lastUpdated'>): CollectionItem => {
  const collections = localStorage.getItem('collections');
  const allCollections = collections ? JSON.parse(collections) : [];
  
  const newItem: CollectionItem = {
    ...item,
    id: uuidv4(),
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  allCollections.push(newItem);
  localStorage.setItem('collections', JSON.stringify(allCollections));
  
  // Also update user's collections
  const users = getUsers();
  const userIndex = users.findIndex(user => user.id === item.userId);
  if (userIndex >= 0) {
    users[userIndex].collections.push(newItem);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update current user if it's the same
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === item.userId) {
      setCurrentUser(users[userIndex]);
    }
  }
  
  return newItem;
};

// Update a collection item
export const updateCollectionItem = (item: CollectionItem): CollectionItem => {
  const collections = localStorage.getItem('collections');
  const allCollections = collections ? JSON.parse(collections) : [];
  
  const updatedItem = {
    ...item,
    lastUpdated: new Date().toISOString()
  };
  
  const index = allCollections.findIndex((c: CollectionItem) => c.id === item.id);
  if (index >= 0) {
    allCollections[index] = updatedItem;
    localStorage.setItem('collections', JSON.stringify(allCollections));
    
    // Also update user's collections
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === item.userId);
    if (userIndex >= 0) {
      const collectionIndex = users[userIndex].collections.findIndex(c => c.id === item.id);
      if (collectionIndex >= 0) {
        users[userIndex].collections[collectionIndex] = updatedItem;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user if it's the same
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === item.userId) {
          setCurrentUser(users[userIndex]);
        }
      }
    }
  }
  
  return updatedItem;
};

// Delete a collection item
export const deleteCollectionItem = (itemId: string): boolean => {
  const collections = localStorage.getItem('collections');
  const allCollections = collections ? JSON.parse(collections) : [];
  
  const index = allCollections.findIndex((c: CollectionItem) => c.id === itemId);
  if (index >= 0) {
    const deletedItem = allCollections[index];
    allCollections.splice(index, 1);
    localStorage.setItem('collections', JSON.stringify(allCollections));
    
    // Also update user's collections
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === deletedItem.userId);
    if (userIndex >= 0) {
      const collectionIndex = users[userIndex].collections.findIndex(c => c.id === itemId);
      if (collectionIndex >= 0) {
        users[userIndex].collections.splice(collectionIndex, 1);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user if it's the same
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === deletedItem.userId) {
          setCurrentUser(users[userIndex]);
        }
      }
    }
    
    return true;
  }
  
  return false;
};

// Mock AI description generator
export type AIAnalysisRequest = {
  category?: string;
  name?: string;
  images?: string[];
  description?: string;
};

export type AIAnalysisResponse = {
  category: string;
  name: string;
  type: string;
  manufacturer: string;
  yearProduced: string;
  edition: string;
  modelNumber: string;
  uniqueIdentifiers: string;
  condition: string;
  flaws: string;
  completeness: string;
  dimensions: string;
  weight: string;
  rarity: string;
  priceEstimate: PriceEstimate;
  confidenceScore: ConfidenceScore;
  notes: string;
};

export const generateAIDescription = (request: AIAnalysisRequest): Promise<AIAnalysisResponse> => {
  // This is a mock implementation that would be replaced with a real AI service
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      const mockResponses: Record<string, Partial<AIAnalysisResponse>> = {
        'Coins': {
          category: 'Coins',
          type: 'Numismatic Collectible',
          manufacturer: 'Various National Mints',
          yearProduced: '1950-1960 (estimated)',
          edition: 'Circulation Issue',
          condition: 'Very Fine to Extremely Fine',
          rarity: 'Uncommon',
          confidenceScore: { 
            score: 78, 
            level: 'medium',
            factors: [
              { factor: "Category identified", impact: 10 },
              { factor: "Year range estimated", impact: 15 },
              { factor: "Condition assessed", impact: 20 },
              { factor: "Rarity determined", impact: 15 },
              { factor: "Market data available", impact: 18 }
            ]
          }
        },
        'Trading Cards': {
          category: 'Trading Cards',
          type: 'Collectible Card Game',
          manufacturer: 'Wizards of the Coast or Similar Publisher',
          yearProduced: '1995-2005 (estimated)',
          edition: 'Base Set or Early Expansion',
          condition: 'Near Mint',
          rarity: 'Rare',
          confidenceScore: { 
            score: 82, 
            level: 'high',
            factors: [
              { factor: "Category identified", impact: 10 },
              { factor: "Year range estimated", impact: 15 },
              { factor: "Condition assessed", impact: 20 },
              { factor: "Rarity determined", impact: 15 },
              { factor: "Market data available", impact: 18 }
            ]
          }
        },
        'Action Figures': {
          category: 'Action Figures',
          type: 'Collectible Toy',
          manufacturer: 'Hasbro or Kenner',
          yearProduced: '1980-1990 (estimated)',
          edition: 'Original Release',
          condition: 'Good to Very Good',
          rarity: 'Common',
          confidenceScore: { 
            score: 65, 
            level: 'medium',
            factors: [
              { factor: "Category identified", impact: 10 },
              { factor: "Year range estimated", impact: 15 },
              { factor: "Condition assessed", impact: 20 },
              { factor: "Rarity determined", impact: 15 },
              { factor: "Market data available", impact: 18 }
            ]
          }
        },
        'Stamps': {
          category: 'Stamps',
          type: 'Philatelic Item',
          manufacturer: 'USPS or Foreign Postal Service',
          yearProduced: '1930-1950 (estimated)',
          edition: 'First Issue',
          condition: 'Fine',
          rarity: 'Uncommon',
          confidenceScore: { 
            score: 58, 
            level: 'medium',
            factors: [
              { factor: "Category identified", impact: 10 },
              { factor: "Year range estimated", impact: 15 },
              { factor: "Condition assessed", impact: 20 },
              { factor: "Rarity determined", impact: 15 },
              { factor: "Market data available", impact: 18 }
            ]
          }
        },
        'Comics': {
          category: 'Comics',
          type: 'Comic Book',
          manufacturer: 'Marvel or DC',
          yearProduced: '1970-1985 (estimated)',
          edition: 'First Print',
          condition: 'Very Good',
          rarity: 'Uncommon',
          confidenceScore: { 
            score: 72, 
            level: 'medium',
            factors: [
              { factor: "Category identified", impact: 10 },
              { factor: "Year range estimated", impact: 15 },
              { factor: "Condition assessed", impact: 20 },
              { factor: "Rarity determined", impact: 15 },
              { factor: "Market data available", impact: 18 }
            ]
          }
        },
        'Vinyl Records': {
          category: 'Vinyl Records',
          type: 'Music Collectible',
          manufacturer: 'Various Record Labels',
          yearProduced: '1960-1975 (estimated)',
          edition: 'First Pressing',
          condition: 'Very Good Plus',
          rarity: 'Uncommon',
          confidenceScore: { 
            score: 68, 
            level: 'medium',
            factors: [
              { factor: "Category identified", impact: 10 },
              { factor: "Year range estimated", impact: 15 },
              { factor: "Condition assessed", impact: 20 },
              { factor: "Rarity determined", impact: 15 },
              { factor: "Market data available", impact: 18 }
            ]
          }
        }
      };
      
      // Use provided category or pick random one
      const category = request.category || Object.keys(mockResponses)[Math.floor(Math.random() * Object.keys(mockResponses).length)];
      const baseResponse = mockResponses[category] || mockResponses['Coins'];
      
      const response: AIAnalysisResponse = {
        category: baseResponse.category || category,
        name: request.name || `Collectible ${category} Item`,
        type: baseResponse.type || 'Collectible',
        manufacturer: baseResponse.manufacturer || 'Unknown Manufacturer',
        yearProduced: baseResponse.yearProduced || 'Unknown Year',
        edition: baseResponse.edition || 'Standard Edition',
        modelNumber: 'N/A',
        uniqueIdentifiers: 'None identified',
        condition: baseResponse.condition || 'Good',
        flaws: 'Minor wear consistent with age',
        completeness: 'Complete',
        dimensions: 'Approx. 10cm x 5cm',
        weight: 'Approx. 50g',
        rarity: baseResponse.rarity || 'Common',
        priceEstimate: {
          low: Math.floor(Math.random() * 100) + 50,
          average: Math.floor(Math.random() * 200) + 150,
          high: Math.floor(Math.random() * 300) + 350,
          marketValue: Math.floor(Math.random() * 200) + 250
        },
        confidenceScore: baseResponse.confidenceScore || { score: 50, level: 'medium' },
        notes: 'This is an automatically generated description based on limited information. For more accurate details, consult with a specialist appraiser.'
      };
      
      resolve(response);
    }, 1500); // 1.5 second delay to simulate processing
  });
};
