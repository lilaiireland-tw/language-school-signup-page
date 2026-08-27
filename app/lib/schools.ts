export type SchoolCity = "Dublin" | "Cork" | "Galway" | "Limerick";
export type SchoolStatus = "active" | "review" | "paused";

export type PartnerSchool = {
  id: string;
  name: string;
  city: SchoolCity;
  logo: string;
  logoSize?: string;
  status: SchoolStatus;
  visible: boolean;
  directApplicationEligible: boolean;
};

const school = (id: string, name: string, city: SchoolCity, logo: string, logoSize?: string): PartnerSchool => ({ id, name, city, logo, logoSize, status: "active", visible: true, directApplicationEligible: true });

export const partnerSchools: PartnerSchool[] = [
  school("isi-dublin", "ISI Dublin", "Dublin", "logo-isi-learning.png"),
  school("babel-dublin", "Babel Academy of English", "Dublin", "logo-babel-academy.png"),
  school("atlas-dublin", "Atlas Language School", "Dublin", "logo-atlas-language-school.png", "large"),
  school("ned-dublin", "NED College", "Dublin", "logo-ned-college.png"),
  school("ned-limerick", "NED College Limerick", "Limerick", "logo-ned-college.png"),
  school("icot-dublin", "ICOT College", "Dublin", "logo-icot-college.png"),
  school("icot-cork", "ICOT College Cork", "Cork", "logo-icot-college.png"),
  school("eli-dublin", "ELI Schools", "Dublin", "logo-eli-schools.png"),
  school("emerald-dublin", "Emerald Cultural Institute", "Dublin", "logo-emerald-cultural-institute.png", "large"),
  school("ces-dublin", "Centre of English Studies", "Dublin", "logo-centre-of-english-studies.png"),
  { ...school("erin-dublin", "Erin College Dublin", "Dublin", "logo-erin-college.png", "large"), status: "review", visible: false, directApplicationEligible: false },
  school("liffey-dublin", "Liffey College", "Dublin", "logo-liffey-college.png"),
  school("apollo-dublin", "Apollo Language Centre", "Dublin", "logo-apollo-language-centre.png"),
  school("seda-dublin", "SEDA College", "Dublin", "logo-seda-college.png"),
  school("everest-dublin", "Everest English", "Dublin", "logo-everest-english.png"),
  school("all-dublin", "Active Language Learning", "Dublin", "logo-active-language-learning.png", "active"),
  school("atc-dublin", "ATC Language Schools", "Dublin", "logo-atc-language-schools.png", "large"),
  school("ec-dublin", "EC English", "Dublin", "logo-ec-english.png"),
  school("english-path-dublin", "English Path", "Dublin", "logo-english-path.png"),
  school("academic-bridge-dublin", "Academic Bridge", "Dublin", "logo-academic-bridge.png"),
  school("delfin-dublin", "Delfin English School", "Dublin", "logo-delfin-english-school.png"),
  school("twin-dublin", "Twin English Centre", "Dublin", "logo-twin-english-centre.png"),
  { ...school("erin-cork", "Erin College Cork", "Cork", "logo-erin-college.png", "large"), status: "review", visible: false, directApplicationEligible: false },
  school("cec-cork", "Cork English College", "Cork", "logo-cork-english-college.png"),
  school("bridge-mills-galway", "Bridge Mills Galway", "Galway", "logo-bridge-mills-galway.png"),
  school("llc-limerick", "Limerick Language Centre", "Limerick", "logo-limerick-language-centre.png"),
];

export const visiblePartnerSchools = partnerSchools.filter((item) => item.visible);
export const nonCitySchoolOptions = ["其他指定學校", "尚未確定"] as const;
export function getSchoolOptionsForCity(city: string): string[] {
  return [
    ...partnerSchools.filter((item) => item.city === city && item.visible && item.directApplicationEligible).map((item) => item.name),
    ...nonCitySchoolOptions,
  ];
}
