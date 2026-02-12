export interface SubStrand {
    name: string;
    topics: string[];
}

export interface Strand {
    name: string;
    subStrands: SubStrand[];
}

export interface SubjectData {
    subject: string;
    strands: Strand[];
}

export const curriculumData: SubjectData[] = [
    {
        subject: "Mathematics",
        strands: [
            {
                name: "Number",
                subStrands: [
                    { name: "Counting, Representation & Cardinality", topics: ["Place Value", "Cardinality", "Scientific Notation"] },
                    { name: "Number Operations", topics: ["Addition", "Subtraction", "Multiplication", "Division", "BODMAS"] },
                    { name: "Fractions, Decimals & Percentages", topics: ["Equivalent Fractions", "Decimal Conversion", "Percentage Increase/Decrease"] },
                    { name: "Ratio & Proportion", topics: ["Simplifying Ratios", "Direct/Inverse Proportion"] }
                ]
            },
            {
                name: "Algebra",
                subStrands: [
                    { name: "Patterns & Relationships", topics: ["Number Patterns", "Sequences"] },
                    { name: "Algebraic Expressions", topics: ["Simplification", "Expansion", "Factorization"] },
                    { name: "Equations & Inequalities", topics: ["Linear Equations", "Simultaneous Equations", "Linear Inequalities"] }
                ]
            },
            {
                name: "Geometry and Measurement",
                subStrands: [
                    { name: "Shapes and Space", topics: ["Properties of Triangles", "Polygons", "Circles"] },
                    { name: "Measurement", topics: ["Area and Perimeter", "Volume and Surface Area", "Pythagoras Theorem"] },
                    { name: "Geometric Reasoning", topics: ["Angles", "Similarity and Congruence"] }
                ]
            }
        ]
    },
    {
        subject: "Science",
        strands: [
            {
                name: "Diversity of Matter",
                subStrands: [
                    { name: "Living and Non-Living things", topics: ["Classification", "Cell Structure"] },
                    { name: "Materials", topics: ["Metals and Non-metals", "Physical and Chemical Changes"] }
                ]
            },
            {
                name: "Cycles",
                subStrands: [
                    { name: "Earth Science", topics: ["The Solar System", "Water Cycle", "Rock Cycle"] },
                    { name: "Life Cycles", topics: ["Plant Reproduction", "Animal Life Cycles"] }
                ]
            },
            {
                name: "Systems",
                subStrands: [
                    { name: "Plant and Animal Systems", topics: ["Photosynthesis", "Human Digestive System", "Human Circulatory System"] }
                ]
            },
            {
                name: "Forces and Energy",
                subStrands: [
                    { name: "Energy", topics: ["Forms of Energy", "Energy Transformation", "Renewable Energy"] },
                    { name: "Forces and Motion", topics: ["Newton's Laws", "Friction", "Pressure"] }
                ]
            }
        ]
    }
];

export const getSubjects = () => curriculumData.map(s => s.subject);

export const getStrands = (subject: string) => {
    const s = curriculumData.find(item => item.subject === subject);
    return s ? s.strands.map(strand => strand.name) : [];
};

export const getSubStrands = (subject: string, strandName: string) => {
    const s = curriculumData.find(item => item.subject === subject);
    const strand = s?.strands.find(st => st.name === strandName);
    return strand ? strand.subStrands.map(ss => ss.name) : [];
};

export const getTopics = (subject: string, strandName: string, subStrandName: string) => {
    const s = curriculumData.find(item => item.subject === subject);
    const strand = s?.strands.find(st => st.name === strandName);
    const subStrand = strand?.subStrands.find(ss => ss.name === subStrandName);
    return subStrand ? subStrand.topics : [];
};
