export interface StadiumNode {
  id: string;
  name: string;
  type: 'gate' | 'section' | 'facility';
  category?: 'washroom' | 'food' | 'medical' | 'accessibility' | 'exit' | 'info';
  description: string;
  accessible: boolean;
  details?: string;
}

export interface StadiumEdge {
  from: string;
  to: string;
  distanceMeters: number;
  description: string;
}

export interface StadiumGraph {
  nodes: StadiumNode[];
  edges: StadiumEdge[];
}

export const STADIUM_GRAPH: StadiumGraph = {
  nodes: [
    // Gates
    { id: 'gate-1', name: 'Gate 1 (North Entry)', type: 'gate', category: 'exit', description: 'Main north entrance and exit.', accessible: true },
    { id: 'gate-2', name: 'Gate 2', type: 'gate', category: 'exit', description: 'Northeast gate.', accessible: false },
    { id: 'gate-3', name: 'Gate 3', type: 'gate', category: 'exit', description: 'East gate.', accessible: true },
    { id: 'gate-4', name: 'Gate 4 (South Entry)', type: 'gate', category: 'exit', description: 'Main south entrance and exit. Heavy traffic.', accessible: true },
    { id: 'gate-5', name: 'Gate 5', type: 'gate', category: 'exit', description: 'Southwest gate.', accessible: false },
    { id: 'gate-6', name: 'Gate 6', type: 'gate', category: 'exit', description: 'West gate.', accessible: true },
    { id: 'gate-7', name: 'Gate 7', type: 'gate', category: 'exit', description: 'Northwest gate.', accessible: false },
    { id: 'gate-8', name: 'Gate 8 (VIP)', type: 'gate', category: 'exit', description: 'VIP and hospitality entrance.', accessible: true },

    // Sections
    { id: 'sec-a', name: 'Section A', type: 'section', description: 'Lower bowl seats near Gate 1.', accessible: true },
    { id: 'sec-b', name: 'Section B', type: 'section', description: 'Lower bowl seats near Gate 2/3.', accessible: true },
    { id: 'sec-c', name: 'Section C', type: 'section', description: 'Lower bowl seats near Gate 3.', accessible: true },
    { id: 'sec-d', name: 'Section D', type: 'section', description: 'Lower bowl seats near Gate 4.', accessible: true },
    { id: 'sec-e', name: 'Section E', type: 'section', description: 'Lower bowl seats near Gate 5.', accessible: true },
    { id: 'sec-f', name: 'Section F', type: 'section', description: 'Lower bowl seats near Gate 6.', accessible: true },
    { id: 'sec-g', name: 'Section G', type: 'section', description: 'Lower bowl seats near Gate 7.', accessible: true },
    { id: 'sec-h', name: 'Section H', type: 'section', description: 'Lower bowl seats near Gate 8.', accessible: true },

    // Facilities
    { id: 'fac-wash-1', name: 'Washroom A', type: 'facility', category: 'washroom', description: 'Standard restroom.', accessible: false, details: 'Men and Women stalls. No baby changing station.' },
    { id: 'fac-wash-acc-1', name: 'Accessible Washroom B', type: 'facility', category: 'washroom', description: 'Fully accessible restroom with changing station.', accessible: true, details: 'Wheelchair access. Baby changing table. Panic button.' },
    { id: 'fac-wash-2', name: 'Washroom C', type: 'facility', category: 'washroom', description: 'Standard restroom.', accessible: false, details: 'Men and Women stalls.' },
    
    { id: 'fac-food-veg', name: 'Green Bite', type: 'facility', category: 'food', description: 'Vegetarian and vegan food stand.', accessible: true, details: 'Menu: Veg Burger ($8.50), Quinoa Bowl ($9.00), Green Salad ($7.00), Soda ($3.00), Water ($2.00). All items under $10.' },
    { id: 'fac-food-classic', name: 'Arena Eats', type: 'facility', category: 'food', description: 'Classic stadium snacks.', accessible: true, details: 'Menu: Beef Hotdog ($6.00), Cheese Nachos ($5.50), Salted Fries ($4.00), Soda ($3.50).' },
    
    { id: 'fac-med-1', name: 'Medical Point Alpha', type: 'facility', category: 'medical', description: 'Primary first aid station.', accessible: true, details: 'Doctor on duty. Defibrillator (AED) equipped. Wheelchair assistance.' },
    { id: 'fac-med-2', name: 'Medical Point Beta', type: 'facility', category: 'medical', description: 'First aid outpost.', accessible: true, details: 'Nurse on duty. Defibrillator (AED) equipped.' },
    { id: 'fac-info-1', name: 'Information Desk', type: 'facility', category: 'info', description: 'Stadia helper services and lost property.', accessible: true, details: 'Lost and found registry. Multilingual helpers.' }
  ],
  edges: [
    // Gate 1 connections
    { from: 'gate-1', to: 'sec-a', distanceMeters: 40, description: 'via Concourse North' },
    { from: 'gate-1', to: 'fac-food-classic', distanceMeters: 20, description: 'via Concourse North' },

    // Gate 2 connections
    { from: 'gate-2', to: 'sec-b', distanceMeters: 50, description: 'via Concourse East' },
    { from: 'gate-2', to: 'fac-wash-1', distanceMeters: 15, description: 'via Concourse East' },

    // Gate 3 connections
    { from: 'gate-3', to: 'sec-c', distanceMeters: 45, description: 'via Concourse East' },
    { from: 'sec-c', to: 'fac-wash-acc-1', distanceMeters: 30, description: 'via Corridor C-Access' },
    { from: 'sec-b', to: 'fac-food-veg', distanceMeters: 25, description: 'via Concourse East' },

    // Gate 4 connections
    { from: 'gate-4', to: 'sec-d', distanceMeters: 40, description: 'via Concourse South' },
    { from: 'gate-4', to: 'fac-med-1', distanceMeters: 35, description: 'via Concourse South' },

    // Gate 5 connections
    { from: 'gate-5', to: 'sec-e', distanceMeters: 55, description: 'via Concourse South' },
    { from: 'sec-e', to: 'fac-wash-2', distanceMeters: 20, description: 'via Concourse South' },

    // Gate 6 connections
    { from: 'gate-6', to: 'sec-f', distanceMeters: 45, description: 'via Concourse West' },
    { from: 'sec-f', to: 'fac-med-2', distanceMeters: 30, description: 'via Concourse West' },

    // Gate 7 connections
    { from: 'gate-7', to: 'sec-g', distanceMeters: 50, description: 'via Concourse Northwest' },

    // Gate 8 connections
    { from: 'gate-8', to: 'sec-h', distanceMeters: 30, description: 'via Concourse Northwest' },
    { from: 'gate-8', to: 'fac-info-1', distanceMeters: 15, description: 'via Concourse Northwest' },

    // Inter-concourse shortcuts
    { from: 'sec-a', to: 'sec-b', distanceMeters: 80, description: 'via Concourse A-B' },
    { from: 'sec-b', to: 'sec-c', distanceMeters: 90, description: 'via Concourse B-C' },
    { from: 'sec-c', to: 'sec-d', distanceMeters: 100, description: 'via Concourse C-D' },
    { from: 'sec-d', to: 'sec-e', distanceMeters: 90, description: 'via Concourse D-E' },
    { from: 'sec-e', to: 'sec-f', distanceMeters: 80, description: 'via Concourse E-F' },
    { from: 'sec-f', to: 'sec-g', distanceMeters: 90, description: 'via Concourse F-G' },
    { from: 'sec-g', to: 'sec-h', distanceMeters: 100, description: 'via Concourse G-H' },
    { from: 'sec-h', to: 'sec-a', distanceMeters: 110, description: 'via Concourse H-A' }
  ]
};
