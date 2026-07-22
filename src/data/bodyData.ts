export type BodyData = {
  name: string;
  type: string;
  description: string;
  mass: string;
  temp: string;
  radius: string;
  gravity: string;
};

export const BODY_DATA: Record<string, BodyData> = {
  "Sun": {
    name: "The Sun",
    type: "Yellow Dwarf Star",
    description: "The heart of our solar system. A nearly perfect sphere of hot plasma, generating magnetic fields via a dynamo process.",
    mass: "1.989 × 10^30 kg",
    temp: "5,500 °C (Surface)",
    radius: "696,340 km",
    gravity: "274 m/s²"
  },
  "Mercury": {
    name: "Mercury",
    type: "Terrestrial Planet",
    description: "The smallest planet in our solar system and closest to the Sun. It has a solid, cratered surface, much like Earth's moon.",
    mass: "3.285 × 10^23 kg",
    temp: "-173 to 427 °C",
    radius: "2,439 km",
    gravity: "3.7 m/s²"
  },
  "Venus": {
    name: "Venus",
    type: "Terrestrial Planet",
    description: "Earth's toxic twin. It spins slowly in the opposite direction of most planets and features a thick, heat-trapping atmosphere.",
    mass: "4.867 × 10^24 kg",
    temp: "462 °C",
    radius: "6,051 km",
    gravity: "8.87 m/s²"
  },
  "Earth": {
    name: "Earth",
    type: "Terrestrial Planet",
    description: "Our home planet. It is the only place we know of so far that's inhabited by living things, featuring vast oceans of liquid water.",
    mass: "5.972 × 10^24 kg",
    temp: "15 °C (Average)",
    radius: "6,371 km",
    gravity: "9.8 m/s²"
  },
  "Moon": {
    name: "The Moon",
    type: "Natural Satellite",
    description: "Earth's only natural satellite. It is the fifth largest moon in the solar system and influences our ocean tides.",
    mass: "7.342 × 10^22 kg",
    temp: "-173 to 117 °C",
    radius: "1,737 km",
    gravity: "1.62 m/s²"
  },
  "Mars": {
    name: "Mars",
    type: "Terrestrial Planet",
    description: "The Red Planet. A dusty, cold, desert world with a very thin atmosphere, featuring evidence of ancient liquid water.",
    mass: "6.39 × 10^23 kg",
    temp: "-153 to 20 °C",
    radius: "3,389 km",
    gravity: "3.71 m/s²"
  },
  "Jupiter": {
    name: "Jupiter",
    type: "Gas Giant",
    description: "The largest planet in our solar system. A massive world mostly composed of hydrogen and helium, featuring the iconic Great Red Spot.",
    mass: "1.898 × 10^27 kg",
    temp: "-110 °C",
    radius: "69,911 km",
    gravity: "24.79 m/s²"
  },
  "Saturn": {
    name: "Saturn",
    type: "Gas Giant",
    description: "Adorned with a dazzling system of icy rings, Saturn is a massive world composed mostly of hydrogen and helium.",
    mass: "5.683 × 10^26 kg",
    temp: "-140 °C",
    radius: "58,232 km",
    gravity: "10.44 m/s²"
  },
  "Uranus": {
    name: "Uranus",
    type: "Ice Giant",
    description: "The seventh planet rotates on its side. It's composed primarily of ices and features faint rings and numerous small moons.",
    mass: "8.681 × 10^25 kg",
    temp: "-195 °C",
    radius: "25,362 km",
    gravity: "8.69 m/s²"
  },
  "Neptune": {
    name: "Neptune",
    type: "Ice Giant",
    description: "Dark, cold, and whipped by supersonic winds, Neptune is the most distant major planet orbiting our Sun.",
    mass: "1.024 × 10^26 kg",
    temp: "-200 °C",
    radius: "24,622 km",
    gravity: "11.15 m/s²"
  },
  "Pluto": {
    name: "Pluto",
    type: "Dwarf Planet",
    description: "A complex world of ice mountains and frozen plains. Once considered the ninth planet, it is the largest known member of the Kuiper Belt.",
    mass: "1.309 × 10^22 kg",
    temp: "-225 °C",
    radius: "1,188 km",
    gravity: "0.62 m/s²"
  },
  "HalleysComet": {
    name: "Halley's Comet",
    type: "Short-period Comet",
    description: "The most famous of the periodic comets, returning to Earth's vicinity every 75-76 years. It's a dark, icy body that leaves a spectacular tail when nearing the Sun.",
    mass: "2.2 × 10^14 kg",
    temp: "Varies wildly",
    radius: "5.5 km",
    gravity: "0.0001 m/s²"
  },
  "Comet67P": {
    name: "Comet 67P",
    type: "Jupiter-family Comet",
    description: "A rubber-duck-shaped comet famously visited by the Rosetta spacecraft. It is composed of dust, ice, and organic compounds.",
    mass: "1.0 × 10^13 kg",
    temp: "Varies wildly",
    radius: "2.0 km",
    gravity: "0.0001 m/s²"
  }
};

export const getBodyData = (key: string): BodyData => {
  if (BODY_DATA[key]) return BODY_DATA[key];
  
  const isAsteroid = key.includes("Asteroid") || key.includes("Trojan") || key.includes("Ceres") || key.includes("Vesta") || key.includes("Pallas");
  const isKuiper = key.includes("Kuiper") || key.includes("Eris") || key.includes("Makemake") || key.includes("Haumea") || key.includes("Sedna");
  
  if (isAsteroid) {
    return {
      name: key.replace(/([A-Z])/g, ' $1').trim(),
      type: "Asteroid",
      description: "A small, rocky body orbiting the Sun. Remnants from the early formation of our solar system.",
      mass: "Unknown",
      temp: "Cold",
      radius: "Varies",
      gravity: "Microgravity"
    };
  }
  
  if (isKuiper) {
    return {
      name: key.replace(/([A-Z])/g, ' $1').trim(),
      type: "Trans-Neptunian Object",
      description: "An icy body in the distant outer reaches of our solar system beyond Neptune.",
      mass: "Unknown",
      temp: "-220 °C",
      radius: "Varies",
      gravity: "Microgravity"
    };
  }
  
  return {
    name: key.replace(/([A-Z])/g, ' $1').trim(),
    type: "Natural Satellite",
    description: "A natural moon orbiting a larger planetary body in the solar system.",
    mass: "Unknown",
    temp: "Unknown",
    radius: "Varies",
    gravity: "Low"
  };
};
