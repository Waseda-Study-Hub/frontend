export type SchoolLevel = "undergraduate" | "graduate" | "professional";
export type ProgramLanguage = "english-based" | "japanese-taught";
export type School = {
  id: string;
  name: string;
  abbreviation: string;
  level: SchoolLevel;
  programLanguage: ProgramLanguage;
  aliases: string[];
};

const school = (
  id: string,
  name: string,
  abbreviation: string,
  level: SchoolLevel,
  programLanguage: ProgramLanguage,
  aliases: string[] = [],
): School => ({ id, name, abbreviation, level, programLanguage, aliases });

export const SCHOOLS: School[] = [
  school(
    "ug-fse-en",
    "School of Fundamental Science and Engineering (Undergraduate)",
    "FSE",
    "undergraduate",
    "english-based",
  ),
  school(
    "ug-cse-en",
    "School of Creative Science and Engineering (Undergraduate)",
    "CSE",
    "undergraduate",
    "english-based",
  ),
  school(
    "ug-pse-en",
    "School of Political Science and Economics (Undergraduate)",
    "PSE",
    "undergraduate",
    "english-based",
  ),
  school(
    "ug-sss-en",
    "School of Social Sciences (Undergraduate)",
    "SSS",
    "undergraduate",
    "english-based",
  ),
  school(
    "ug-sils-en",
    "School of International Liberal Studies (SILS) (Undergraduate)",
    "SILS",
    "undergraduate",
    "english-based",
  ),
  school(
    "ug-cms-en",
    "School of Culture, Media and Society (Undergraduate)",
    "CMS",
    "undergraduate",
    "english-based",
  ),
  school(
    "grad-fse-en",
    "Graduate School of Fundamental Science and Engineering",
    "FSE",
    "graduate",
    "english-based",
  ),
  school(
    "grad-cse-en",
    "Graduate School of Creative Science and Engineering",
    "CSE",
    "graduate",
    "english-based",
  ),
  school(
    "grad-ase-en",
    "Graduate School of Advanced Science and Engineering",
    "ASE",
    "graduate",
    "english-based",
  ),
  school(
    "grad-ips-en",
    "Graduate School of Information, Production and Systems (IPS)",
    "IPS",
    "graduate",
    "english-based",
  ),
  school(
    "grad-weee-en",
    "Graduate School of Environment and Energy Engineering (WEEE)",
    "WEEE",
    "graduate",
    "english-based",
  ),
  school(
    "grad-gsps-en",
    "Graduate School of Political Science",
    "GSPS",
    "graduate",
    "english-based",
  ),
  school(
    "grad-gse-en",
    "Graduate School of Economics",
    "GSE",
    "graduate",
    "english-based",
  ),
  school(
    "grad-law-en",
    "Graduate School of Law",
    "LAW",
    "graduate",
    "english-based",
  ),
  school(
    "grad-las-en",
    "Graduate School of Letters, Arts and Sciences",
    "LAS",
    "graduate",
    "english-based",
  ),
  school(
    "grad-gsc-en",
    "Graduate School of Commerce",
    "GSC",
    "graduate",
    "english-based",
  ),
  school(
    "grad-wbs-en",
    "Graduate School of Business and Finance (Waseda Business School)",
    "WBS",
    "graduate",
    "english-based",
  ),
  school(
    "grad-gsss-en",
    "Graduate School of Social Sciences",
    "GSSS",
    "graduate",
    "english-based",
  ),
  school(
    "grad-sps-en",
    "Graduate School of Sport Sciences",
    "SPS",
    "graduate",
    "english-based",
  ),
  school(
    "grad-gsaps-en",
    "Graduate School of Asia-Pacific Studies (GSAPS)",
    "GSAPS",
    "graduate",
    "english-based",
  ),
  school(
    "grad-gsiccs-en",
    "Graduate School of International Culture and Communication Studies (GSICCS)",
    "GSICCS",
    "graduate",
    "english-based",
  ),
  school(
    "ug-ase-ja",
    "School of Advanced Science and Engineering (Undergraduate)",
    "ASE",
    "undergraduate",
    "japanese-taught",
  ),
  school(
    "ug-law-ja",
    "School of Law (Undergraduate)",
    "LAW",
    "undergraduate",
    "japanese-taught",
  ),
  school(
    "ug-hss-ja",
    "School of Humanities and Social Sciences (Undergraduate)",
    "HSS",
    "undergraduate",
    "japanese-taught",
  ),
  school(
    "ug-edu-ja",
    "School of Education (Undergraduate)",
    "EDU",
    "undergraduate",
    "japanese-taught",
  ),
  school(
    "ug-soc-ja",
    "School of Commerce (Undergraduate)",
    "SOC",
    "undergraduate",
    "japanese-taught",
  ),
  school(
    "ug-hum-ja",
    "School of Human Sciences (Undergraduate)",
    "HUM",
    "undergraduate",
    "japanese-taught",
  ),
  school(
    "ug-sps-ja",
    "School of Sport Sciences (Undergraduate)",
    "SPS",
    "undergraduate",
    "japanese-taught",
  ),
  school(
    "pro-wls-ja",
    "Waseda Law School (Professional Graduate School / J.D.)",
    "WLS",
    "professional",
    "japanese-taught",
  ),
  school(
    "pro-gsa-ja",
    "Graduate School of Accountancy (Professional Graduate School)",
    "GSA",
    "professional",
    "japanese-taught",
  ),
  school(
    "grad-edu-ja",
    "Graduate School of Education",
    "EDU",
    "graduate",
    "japanese-taught",
  ),
  school(
    "grad-hum-ja",
    "Graduate School of Human Sciences",
    "HUM",
    "graduate",
    "japanese-taught",
  ),
  school(
    "grad-gsjal-ja",
    "Graduate School of Japanese Applied Linguistics (GSJAL)",
    "GSJAL",
    "graduate",
    "japanese-taught",
  ),
];

export const findSchool = (value?: string) =>
  SCHOOLS.find((item) => item.id === value || item.name === value);
