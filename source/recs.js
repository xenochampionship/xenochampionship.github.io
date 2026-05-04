const dataHostUrl = "https://xenochampionship.co.uk/source/data/";

const defaultCharity = {
    cause: "Cancer Research UK",
    link: "https://fundraise.cancerresearchuk.org/page/xc-2026" // https://www.cancerresearchuk.org
};

const records = [
    {
        title: "XC 2026", dates: "01/08/2026 - 31/08/2026", 
        past: false, // If current or upcoming, set past to false
        top3: ["TBC", "TBC", "TBC"], // 1st (Gold), 2nd (Silver), 3rd (Bronze)
        resultsJson: dataHostUrl+"xc26.json",
        charity: {current: 120.00, goal: 200.00, showOnHome: true} // GBP (£)
    }
];
