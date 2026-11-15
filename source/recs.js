const dataHostUrl = "https://xenochampionship.co.uk/source/data/";

// Default Charity For Championships
const defaultCharity = {
    // Cancer Research UK - https://www.cancerresearchuk.org
    cause: "Cancer Research UK",
    link: "https://fundraise.cancerresearchuk.org/page/xc-2026"
};

// Default Charity For Leagues
const leaguesCharity = {
    // Diabetes UK - https://diabetes.org.uk
    cause: "Diabetes UK",
    link: "https://www.justgiving.com/page/xcl-26-27"
};


const records = [
    {
        title: "XC 2027", dates: "01/10/2027 - 14/11/2027", 
        past: false, // If current or upcoming, set past to false
        top3: ["TBD", "TBD", "TBD"], // 1st (Gold), 2nd (Silver), 3rd (Bronze)
        resultsJson: dataHostUrl+"xc27.json",
        charity: {current: 0.00, goal: 0.00, showOnHome: false} // GBP (£)
    },
    {
        title: "XC 2026", dates: "01/10/2026 - 14/11/2026", 
        past: true, // If current or upcoming, set past to false
        top3: ["Scarecr0w", "JimmyM7", "ItIsYeOwl"], // 1st (Gold), 2nd (Silver), 3rd (Bronze)
        resultsJson: dataHostUrl+"xc26.json",
        charity: {current: 165.00, goal: 200.00, showOnHome: false} // GBP (£)
    }
];

const leagueRecords = [
    {
        league: "26-27",
        current_season: true,
        components: {
            winter: {
                year: 2026,
                podium: ["TBD", "TBD", "TBD"], // 1st - 2nd - 3rd
                file: dataHostUrl+"winter-2026.json"
            },
            spring: {
                year: 2027,
                podium: ["TBD", "TBD", "TBD"], // 1st - 2nd - 3rd
                file: dataHostUrl+"spring-2027.json"
            },
            summer: {
                year: 2027,
                podium: ["TBD", "TBD", "TBD"], // 1st - 2nd - 3rd
                file: dataHostUrl+"summer-2027.json"
            }
        },
        charity: {current: 0.00, goal: 1000.00, showOnHome: true} // GBP (£)
    }
];

const tournamentMonth = "October";
