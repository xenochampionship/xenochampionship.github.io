const dataHostUrl = "https://xenochampionship.co.uk/source/data/";

const defaultCharity = {
    // Cancer Research UK - https://www.cancerresearchuk.org
    cause: "Cancer Research UK",
    link: "https://fundraise.cancerresearchuk.org/page/xc-2026"
};

const records = [
    {
        title: "XC 2026", dates: "01/10/2026 - 12/11/2026", 
        past: false, // If current or upcoming, set past to false
        top3: ["Scarecr0w", "JimmyM7", "TBC"], // 1st (Gold), 2nd (Silver), 3rd (Bronze)
        resultsJson: dataHostUrl+"xc26.json",
        charity: {current: 165.00, goal: 200.00, showOnHome: true} // GBP (£)
    }
];

const leagueRecords = [
    {
        league: "26-27",
        current_season: true,
        components: {
            winter: {
                year: 2026,
                podium: ["#", "#", "#"], // 1st - 2nd - 3rd
                file: dataHostUrl+"winter-2026.json",
                charity: {current: 0.00, goal: 0.00, showOnHome: false} // GBP (£)
            },
            spring: {
                year: 2027,
                podium: ["#", "#", "#"], // 1st - 2nd - 3rd
                file: dataHostUrl+"spring-2027.json",
                charity: {current: 0.00, goal: 0.00, showOnHome: false} // GBP (£)
            },
            summer: {
                year: 2027,
                podium: ["#", "#", "#"], // 1st - 2nd - 3rd
                file: dataHostUrl+"summer-2027.json",
                charity: {current: 0.00, goal: 0.00, showOnHome: false} // GBP (£)
            }
        },

    }
];

const tournamentMonth = "October";
