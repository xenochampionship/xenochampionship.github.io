const pageNames = {
    'home': 'Home',
    'about': 'About',
    'rules': 'Championship Rules',
    'championship': 'About the Championship',
    'hof': 'Hall of Fame',
    'results': 'Past Results',
    'current': null,
    'leagues': 'Leagues',
    'contact': 'Contact',
    'disclaimer': 'Disclaimer',
    'thank-you': 'Thank You',
    'umpires': 'Become an Umpire',
    'umpire-thank-you': 'Thank You'
};

const pageAliases = {
    'league-winter-2026': 'league-winter',
    'league-spring-2027': 'league-spring',
    'league-summer-2027': 'league-summer'
};

const allowedFixtureIds = [
    "Qualifier", 
    "Quarter-Final", 
    "Semi-Final", 
    "Third Place Match", 
    "Grand Final"
];

const fixturePushConfig = {
    workerBaseUrl: "https://xeno-fixture-push-worker.oakshiftsoftware.workers.dev",
    siteId: "xeno-championship",
    serviceWorkerPath: "./sw.js"
};

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from(rawData, character => character.charCodeAt(0));
}

function toggleRuleAccordion(button) {
    const card = button.closest('.accordion-rule-card');
    if (card) {
        card.classList.toggle('expanded');
    }
}

function initializeLeaguePages() {
    const allLeaguesPage = document.getElementById('page-leagues');
    const getComponent = season => {
        const seasonRecord = leagueRecords.find(record => record.components && record.components[season]);
        if (!seasonRecord) {
            return {};
        }

        const component = seasonRecord.components[season];
        return {
            ...component,
            charity: component.charity || seasonRecord.charity
        };
    };
    const getSeasonGroup = season => {
        const seasonRecord = leagueRecords.find(record => record.components && record.components[season]);
        return seasonRecord ? seasonRecord.league : '26-27';
    };
    const createDefinition = (season, seasonName, description, defaultStatus) => {
        const component = getComponent(season);
        const fileYear = String(component.file || '').match(/(?:^|[-_])(20\d{2})(?=\.json(?:$|[?#]))/i);
        const configuredYear = Number(component.year);
        const year = Number.isInteger(configuredYear) && configuredYear >= 2000
            ? configuredYear
            : fileYear
                ? Number(fileYear[1])
                : '';
        return {
            ...component,
            pageId: `league-${season}`,
            title: `${seasonName} League${year ? ` ${year}` : ''}`,
            seasonName,
            seasonGroup: component.seasonGroup || getSeasonGroup(season),
            year,
            description,
            defaultStatus
        };
    };
    const definitions = [
        createDefinition('winter', 'Winter', 'The Winter League opens the seasonal competition cycle. Check the current event status before making plans to compete.', 'postponed'),
        createDefinition('spring', 'Spring', 'The Spring League brings contestants back for another Swiss-style season, with standings built across the full schedule.', 'upcoming'),
        createDefinition('summer', 'Summer', 'The Summer League is the final seasonal league before the Xeno Championship returns in Autumn.', 'upcoming')
    ];

    definitions.forEach(definition => {
        if (!document.getElementById(`page-${definition.pageId}`)) {
            throw new Error(`Missing static page container for ${definition.title}.`);
        }
        pageNames[definition.pageId] = definition.title;
        document.querySelectorAll(`[data-league-season="${definition.seasonName.toLowerCase()}"]`)
            .forEach(link => { link.textContent = definition.title; });
    });

    if (allLeaguesPage) {
        allLeaguesPage.innerHTML = renderLeagueOverview(
            definitions.map(definition => ({ definition, data: null, error: false }))
        );
    }

    return definitions;
}

document.addEventListener('DOMContentLoaded', function() {
    const leaguePageDefinitions = initializeLeaguePages();
    initMobileMenu();
    initAppInstallation();
    initCompletedFixturesDialog();
    initFixturePushControls();

    const navLinks = document.querySelectorAll('.nav-menu a:not(.dropbtn)');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            navigateToPage(targetId);
        });
    });

    document.querySelectorAll('.nav-menu .dropbtn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            parent.classList.toggle('active');
        });
    });

    document.querySelectorAll('footer a').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (!href.startsWith('#')) {
            return;
        }

        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = href.substring(1);
            navigateToPage(targetId);
        });
    });

    // --- Google Analytics 4 SPA hash navigation tracking ---
    function trackPageView(pageId) {
        if (window.gtag) {
            gtag('event', 'page_view', {
                page_location: window.location.href,
                page_path: '/' + pageId,
                page_title: document.title
            });
        }
    }
    // ------------------------------------------------------

    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1) || 'home';
        showPage(hash);
        trackPageView(hash); // Track SPA navigation
    });

    const initialHash = window.location.hash.substring(1) || 'home';
    showPage(initialHash);
    trackPageView(initialHash);

    populateAboutPage();
    populateChampionshipPage();
    populateRulesPage();
    populateUmpiresPage();
    loadCurrentChampionship();
    populateHallOfFame();
    setupPastResultsSelector();
    populateCurrentChampionship();
    populateLeaguePages(leaguePageDefinitions);
});

function initMobileMenu() {
    const hamburger = document.getElementById('hamburger-menu');
    const mobileModal = document.getElementById('mobile-menu-modal');
    const mobileLinks = document.querySelectorAll('.mobile-nav-menu a, .mobile-dropbtn');
    const mobileDropdowns = document.querySelectorAll('.mobile-dropdown');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        mobileModal.classList.toggle('active');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (this.classList.contains('mobile-dropbtn')) {
                const parent = this.parentElement;
                parent.classList.toggle('active');
                return;
            }
            hamburger.classList.remove('active');
            mobileModal.classList.remove('active');
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('header') && !e.target.closest('.mobile-menu-modal')) {
            hamburger.classList.remove('active');
            mobileModal.classList.remove('active');
        }
    });
}

function initAppInstallation() {
    const installButton = document.getElementById('install-app-button');
    const installDialog = document.getElementById('install-app-dialog');
    const installInstructions = document.getElementById('install-app-instructions');
    const closeButton = document.getElementById('install-app-close');
    let deferredInstallPrompt = null;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (isStandalone) {
        document.body.classList.add('app-installed');
    }

    window.addEventListener('beforeinstallprompt', function(event) {
        event.preventDefault();
        deferredInstallPrompt = event;
    });

    window.addEventListener('appinstalled', function() {
        deferredInstallPrompt = null;
        document.body.classList.add('app-installed');
    });

    installButton.addEventListener('click', async function() {
        if (deferredInstallPrompt) {
            await deferredInstallPrompt.prompt();
            const choice = await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            if (choice.outcome === 'accepted') {
                document.body.classList.add('app-installed');
            }
            return;
        }

        const userAgent = navigator.userAgent;
        const isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        if (isAppleMobile) {
            installInstructions.innerHTML = `
                <li>Tap the Share button in Safari.</li>
                <li>Choose <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> to install the app.</li>
            `;
        } else if (/Android/i.test(userAgent)) {
            installInstructions.innerHTML = `
                <li>Open your browser menu.</li>
                <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Confirm to add Xeno Championship to your device.</li>
            `;
        } else {
            installInstructions.innerHTML = `
                <li>Open your browser menu.</li>
                <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
            `;
        }

        installDialog.showModal();
    });

    closeButton.addEventListener('click', function() {
        installDialog.close();
    });
}

function initCompletedFixturesDialog() {
    const dialog = document.getElementById('completed-fixtures-dialog');
    const closeButton = document.getElementById('completed-fixtures-close');
    const dialogTitle = document.getElementById('completed-fixtures-title');
    const dialogContent = document.getElementById('completed-fixtures-content');

    document.addEventListener('click', function(event) {
        const openButton = event.target.closest('[data-open-completed-fixtures]');
        if (openButton && !dialog.open) {
            const sourceId = openButton.dataset.completedFixturesSource;
            const source = sourceId ? document.getElementById(sourceId) : null;
            if (!source) {
                console.error(`Completed fixtures content source "${sourceId}" was not found.`);
                return;
            }
            dialogTitle.textContent = openButton.dataset.completedFixturesTitle || 'Completed Fixtures';
            dialogContent.innerHTML = source.innerHTML;
            dialog.showModal();
        }
    });

    closeButton.addEventListener('click', function() {
        dialog.close();
    });

    dialog.addEventListener('click', function(event) {
        if (event.target === dialog) {
            dialog.close();
        }
    });
}

async function initFixturePushControls() {
    const toggleButton = document.getElementById('fixture-push-toggle');
    const labelElement = document.getElementById('fixture-push-label');
    const indicatorElement = document.querySelector('.fixture-push-indicator');
    const statusElement = document.getElementById('fixture-push-status');
    if (!toggleButton || !labelElement || !indicatorElement || !statusElement) {
        return;
    }

    let registration = null;
    let subscribed = false;
    const setStatus = (message, isError = false) => {
        statusElement.textContent = message;
        statusElement.classList.toggle('error', isError);
        toggleButton.title = message;
    };
    const setSubscribed = isSubscribed => {
        subscribed = isSubscribed;
        toggleButton.setAttribute('aria-pressed', String(isSubscribed));
        toggleButton.setAttribute('aria-label', `${isSubscribed ? 'Disable' : 'Enable'} fixture result alerts. Alerts are currently ${isSubscribed ? 'on' : 'off'}.`);
        labelElement.textContent = isSubscribed ? 'Disable Alerts' : 'Enable Alerts';
        indicatorElement.classList.toggle('is-enabled', isSubscribed);
    };
    const syncSubscription = async subscription => {
        const response = await fetch(fixturePushConfig.workerBaseUrl + '/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: fixturePushConfig.siteId, subscription })
        });
        if (!response.ok) {
            throw new Error('The push service could not save this subscription.');
        }
    };

    toggleButton.addEventListener('click', async () => {
        toggleButton.disabled = true;
        try {
            if (subscribed) {
                registration = registration || await navigator.serviceWorker.register(fixturePushConfig.serviceWorkerPath, { scope: './' });
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    const response = await fetch(fixturePushConfig.workerBaseUrl + '/unsubscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ siteId: fixturePushConfig.siteId, endpoint: subscription.endpoint })
                    });
                    if (!response.ok) {
                        throw new Error('The push service could not remove this subscription.');
                    }
                    await subscription.unsubscribe();
                }
                setSubscribed(false);
                setStatus('Result notifications are disabled on this browser.');
            } else {
                if (Notification.permission === 'denied') {
                    throw new Error('Notifications are blocked in your browser settings.');
                }
                const permission = Notification.permission === 'granted'
                    ? 'granted'
                    : await Notification.requestPermission();
                if (permission !== 'granted') {
                    throw new Error('Notification permission was not granted.');
                }

                registration = registration || await navigator.serviceWorker.register(fixturePushConfig.serviceWorkerPath, { scope: './' });
                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                    const keyResponse = await fetch(fixturePushConfig.workerBaseUrl + '/vapid-public-key');
                    if (!keyResponse.ok) {
                        throw new Error('The push service is not available yet.');
                    }
                    const keyPayload = await keyResponse.json();
                    if (!keyPayload.publicKey) {
                        throw new Error('The push service did not return a VAPID public key.');
                    }
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(keyPayload.publicKey)
                    });
                }
                await syncSubscription(subscription);
                setSubscribed(true);
                setStatus('Result notifications are enabled on this browser.');
            }
        } catch (error) {
            setStatus(error.message || 'Unable to update result notifications.', true);
        } finally {
            toggleButton.disabled = false;
        }
    });

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        toggleButton.disabled = true;
        setStatus('Push notifications are not supported by this browser.', true);
        return;
    }

    try {
        registration = await navigator.serviceWorker.register(fixturePushConfig.serviceWorkerPath, { scope: './' });
        const subscription = await registration.pushManager.getSubscription();
        setSubscribed(Boolean(subscription));
        if (subscription) {
            await syncSubscription(subscription);
            setStatus('Result notifications are enabled on this browser.');
        } else if (Notification.permission === 'denied') {
            setStatus('Notifications are blocked in your browser settings.', true);
        } else {
            setStatus('Get an alert when a fixture result is announced.');
        }
    } catch (error) {
        setStatus(error.message || 'Unable to connect to the push service.', true);
    }
}

function navigateToPage(pageId) {
    window.location.hash = '#' + pageId;
    showPage(pageId);
    window.scrollTo(0, 0);
}

function showPage(pageId) {
    const resolvedPageId = pageAliases[pageId] || pageId;
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById('page-' + resolvedPageId);
    if (targetPage) {
        targetPage.classList.add('active');
        updatePageTitle(resolvedPageId);
    }
}

function updatePageTitle(pageId) {
    let pageName = pageNames[pageId] || pageId;
    
    if (pageId === 'current') {
        const currentRecord = records.find(r => !r.past);
        if (currentRecord) {
            pageName = currentRecord.title;
        }
    }
    
    document.title = pageName ? `Xeno Championship - ${pageName}` : 'Xeno Championship';
}

async function loadCurrentChampionship() {
    const currentRecord = records.find(r => !r.past);
    if (!currentRecord || !currentRecord.resultsJson) return;

    const currentChampionshipMenuItems = document.querySelectorAll('a[href="#current"]');
    currentChampionshipMenuItems.forEach(item => {
        item.innerHTML = currentRecord.title;
    });

    try {
        const response = await fetch(currentRecord.resultsJson, { cache: 'no-store' });
        const data = await response.json();
        populateHomePage(data, currentRecord);
    } catch (error) {
        console.error('Error loading current championship data:', error);
        populateHomePage(null, currentRecord);
    }
}

function populateAboutPage() {
    const aboutPage = document.getElementById('page-about');
    const championshipCharity = defaultCharity.cause || 'Cancer Research UK';
    const leagueCharity = leaguesCharity.cause || 'Diabetes UK';
    aboutPage.innerHTML = `
        <div class="about-circuit">
            <section class="league-overview-hero about-circuit-hero" aria-labelledby="about-circuit-title">
                <div class="league-overview-copy">
                    <span class="league-overview-kicker"><i class="fas fa-compass" aria-hidden="true"></i> The annual Xeno circuit</span>
                    <h1 id="about-circuit-title">Competition through every season</h1>
                    <p>A community-run year of 1v1 Companion battles in No Man's Sky Xeno Arena: three Swiss-style Leagues lead into the Autumn Xeno Championship.</p>
                    <div class="about-circuit-season-note">
                        <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                        <span><strong>Winter · Spring · Summer</strong> Leagues</span>
                        <span class="about-circuit-season-divider" aria-hidden="true">→</span>
                        <span><strong>Autumn</strong> Championship</span>
                    </div>
                    <div class="about-circuit-actions">
                        <button class="btn site-btn" type="button" onclick="navigateToPage('leagues')"><i class="fas fa-layer-group" aria-hidden="true"></i> Explore the Leagues</button>
                        <button class="btn site-btn about-circuit-secondary" type="button" onclick="navigateToPage('championship')"><i class="fas fa-trophy" aria-hidden="true"></i> About the Championship</button>
                    </div>
                </div>
                <div class="league-season-cycle" aria-label="Annual circuit: Winter, Spring, Summer, then the Xeno Championship in Autumn">
                    <div class="league-cycle-season winter"><i class="fas fa-snowflake" aria-hidden="true"></i><span>Winter</span></div>
                    <div class="league-cycle-season spring"><i class="fas fa-seedling" aria-hidden="true"></i><span>Spring</span></div>
                    <div class="league-cycle-season summer"><i class="fas fa-sun" aria-hidden="true"></i><span>Summer</span></div>
                    <div class="league-cycle-championship"><i class="fas fa-trophy" aria-hidden="true"></i><span>Autumn · Xeno Championship</span></div>
                </div>
            </section>

            <section class="about-circuit-overview" aria-labelledby="about-circuit-format-title">
                <div class="about-circuit-section-heading">
                    <span class="league-overview-kicker">One circuit, two competition paths</span>
                    <h2 id="about-circuit-format-title">Play across the year, then chase the title</h2>
                    <p>Each part of the circuit has its own format, rules, and season page with the latest event information.</p>
                </div>
                <div class="about-circuit-paths">
                    <article class="about-circuit-path leagues">
                        <span class="about-circuit-path-label"><i class="fas fa-arrows-rotate" aria-hidden="true"></i> Winter / Spring / Summer · Seasonal</span>
                        <h3>Seasonal Leagues</h3>
                        <p>Three opportunities to compete throughout the year. Every League stays Swiss-style from start to finish, with no knockout stage.</p>
                        <ul>
                            <li><i class="fas fa-check" aria-hidden="true"></i> No fixed player limit</li>
                            <li><i class="fas fa-check" aria-hidden="true"></i> Up to 10 weekly rounds</li>
                            <li><i class="fas fa-check" aria-hidden="true"></i> Final standings decide the podium</li>
                            <li><i class="fas fa-check" aria-hidden="true"></i> Each League's top-ranked contestant is guaranteed a Championship Finals place</li>
                        </ul>
                        <div class="about-circuit-path-actions">
                            <button class="btn site-btn" type="button" onclick="navigateToPage('leagues')">Explore the Leagues</button>
                            <button class="btn site-btn about-circuit-secondary" type="button" onclick="populateLeagueRulesPage()">League Rules</button>
                        </div>
                    </article>
                    <article class="about-circuit-path championship">
                        <span class="about-circuit-path-label"><i class="fas fa-trophy" aria-hidden="true"></i> Autumn · Annual</span>
                        <h3>Xeno Championship</h3>
                        <p>The flagship annual tournament brings the season to a close and crowns the Xeno Champion.</p>
                        <ul>
                            <li><i class="fas fa-check" aria-hidden="true"></i> Up to 8 contestants</li>
                            <li><i class="fas fa-check" aria-hidden="true"></i> 5 Swiss-style qualification rounds</li>
                            <li><i class="fas fa-check" aria-hidden="true"></i> Single-elimination Finals, including guaranteed places for League champions</li>
                        </ul>
                        <div class="about-circuit-path-actions">
                            <button class="btn site-btn" type="button" onclick="navigateToPage('championship')">About the Championship</button>
                            <button class="btn site-btn about-circuit-secondary" type="button" onclick="navigateToChampionshipRulesPage()">Championship Rules</button>
                        </div>
                    </article>
                </div>
            </section>

            <section class="about-circuit-community" aria-labelledby="about-circuit-community-title">
                <div class="about-circuit-community-intro">
                    <span class="about-circuit-path-label"><i class="fas fa-users" aria-hidden="true"></i> Built by the community</span>
                    <h2 id="about-circuit-community-title">Good competition, shared purpose</h2>
                    <p>Organisers, Umpires, and contestants help make the circuit welcoming and fair. Matches are best-of-three Companion battles, with sportsmanship at the heart of every season.</p>
                </div>
                <div class="about-circuit-charities">
                    <article class="about-circuit-charity championship">
                        <i class="fas fa-heart" aria-hidden="true"></i>
                        <div><span>Championship Fundraising</span><strong>${championshipCharity}</strong></div>
                    </article>
                    <article class="about-circuit-charity leagues">
                        <i class="fas fa-heart" aria-hidden="true"></i>
                        <div><span>League Season Fundraising</span><strong>${leagueCharity}</strong></div>
                    </article>
                    <p>Donations are voluntary. Visit the relevant event page for current fundraising information.</p>
                </div>
            </section>
        </div>
    `;
}

function populateChampionshipPage() {
    const page = document.getElementById('page-championship');
    const currentRecord = records.find(record => !record.past);
    const currentEdition = currentRecord?.dates
        ? `
            <div class="championship-edition-chip">
                <i class="fas fa-calendar-check" aria-hidden="true"></i>
                <span>Current edition</span>
                <strong>${currentRecord.title}</strong>
                <span>${currentRecord.dates}</span>
            </div>
        `
        : '';
    const currentAction = currentRecord
        ? `<button class="btn site-btn championship-info-action primary" type="button" onclick="navigateToPage('current')"><i class="fas fa-chart-line" aria-hidden="true"></i> View Current Championship</button>`
        : '';

    page.innerHTML = `
        <div class="championship-info-page">
            <section class="championship-info-hero" aria-labelledby="championship-info-title">
                <img src="https://www.nomanssky.com/media/wzgpapjc/battleshots20.jpg" alt="No Man's Sky Xeno Arena competition">
                <div class="championship-info-hero-content">
                    <span class="championship-info-kicker"><i class="fas fa-trophy" aria-hidden="true"></i> The annual Autumn tournament</span>
                    <h1 id="championship-info-title">One arena. Eight contenders. One champion.</h1>
                    <p>A community-run celebration of No Man's Sky Xeno Arena, where skill, strategy, and sportsmanship decide who earns the title of Xeno Champion.</p>
                    ${currentEdition}
                    <div class="championship-info-actions">
                        ${currentAction}
                        <button class="btn site-btn championship-info-action" type="button" onclick="navigateToChampionshipRulesPage()"><i class="fas fa-book-open" aria-hidden="true"></i> Championship Rules</button>
                    </div>
                </div>
                <div class="championship-info-hero-emblem" aria-hidden="true"><i class="fas fa-trophy"></i></div>
            </section>

            <section class="championship-info-highlights" aria-label="Championship at a glance">
                <article class="championship-highlight">
                    <span class="championship-highlight-icon"><i class="fas fa-users" aria-hidden="true"></i></span>
                    <div><strong>Up to 8</strong><span>Contestants</span></div>
                </article>
                <article class="championship-highlight">
                    <span class="championship-highlight-icon"><i class="fas fa-arrows-rotate" aria-hidden="true"></i></span>
                    <div><strong>5 rounds</strong><span>Swiss qualification</span></div>
                </article>
                <article class="championship-highlight">
                    <span class="championship-highlight-icon"><i class="fas fa-medal" aria-hidden="true"></i></span>
                    <div><strong>Top 4</strong><span>Advance to Finals</span></div>
                </article>
                <article class="championship-highlight">
                    <span class="championship-highlight-icon"><i class="fas fa-gamepad" aria-hidden="true"></i></span>
                    <div><strong>Best of 3</strong><span>Every fixture</span></div>
                </article>
            </section>

            <section class="championship-info-format" aria-labelledby="championship-format-title">
                <div class="championship-info-section-heading">
                    <span class="championship-info-kicker">The road to the title</span>
                    <h2 id="championship-format-title">Consistency earns a place in the Finals</h2>
                    <p>Every match matters, from the first qualification round to the Grand Final.</p>
                </div>
                <div class="championship-format-steps">
                    <article class="championship-format-step">
                        <span class="championship-step-number">01</span>
                        <div>
                            <span class="championship-step-label">Build your record</span>
                            <h3>Swiss qualification</h3>
                            <p>Contestants play five rounds of 1v1 fixtures, with pairings based on results where possible.</p>
                        </div>
                    </article>
                    <article class="championship-format-step">
                        <span class="championship-step-number">02</span>
                        <div>
                            <span class="championship-step-label">The top four</span>
                            <h3>Reach the Finals</h3>
                            <p>The four highest-ranked contestants move on to the semi-finals and the third-place match.</p>
                        </div>
                    </article>
                    <article class="championship-format-step">
                        <span class="championship-step-number">03</span>
                        <div>
                            <span class="championship-step-label">One final battle</span>
                            <h3>Crown a champion</h3>
                            <p>The Grand Final decides the Xeno Champion and Silver Medallist; the third-place match awards Bronze.</p>
                        </div>
                    </article>
                </div>
            </section>

            <section class="championship-info-stories" aria-label="Championship values">
                <article class="championship-info-story charity">
                    <span class="championship-story-icon"><i class="fas fa-heart" aria-hidden="true"></i></span>
                    <div>
                        <span class="championship-story-label">Competition with a cause</span>
                        <h2>Supporting Cancer Research UK</h2>
                        <p>The Championship brings the community together in support of Cancer Research UK. Donations are voluntary and help the charity continue its work.</p>
                        <a href="https://www.cancerresearchuk.org" target="_blank" rel="noopener noreferrer">Learn about the charity <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
                    </div>
                </article>
                <article class="championship-info-story community">
                    <span class="championship-story-icon"><i class="fas fa-scale-balanced" aria-hidden="true"></i></span>
                    <div>
                        <span class="championship-story-label">Made by the community</span>
                        <h2>Fair play comes first</h2>
                        <p>Organizers, Umpires, and contestants all help create a welcoming event built around respect, good sportsmanship, and a shared love of No Man's Sky.</p>
                    </div>
                </article>
            </section>
        </div>
    `;
}

function populateLeagueRulesPage() {
    const rulesPage = document.getElementById('page-rules');
    const shouldNavigate = !rulesPage.classList.contains('active');
    pageNames.rules = 'League Rules';
    if (rulesPage.classList.contains('active')) {
        updatePageTitle('rules');
    }
    rulesPage.innerHTML = `
        <div class="ruleset-switch" role="group" aria-label="Choose rules">
            <button type="button" class="ruleset-switch-button" aria-pressed="false" onclick="populateRulesPage()"><i class="fas fa-trophy" aria-hidden="true"></i> Championship Rules</button>
            <button type="button" class="ruleset-switch-button" aria-pressed="true" onclick="populateLeagueRulesPage()"><i class="fas fa-calendar-alt" aria-hidden="true"></i> League Rules</button>
        </div>
        <h1>League Rules</h1>
        <div class="card hero-card">
            <img src="https://www.nomanssky.com/media/rx0bsrqh/battleshots35.jpg" alt="Xeno Championship Image" class="home-hero-image-secondary">
        </div>
        <p class="para-txt">These rules apply to the Winter, Spring, and Summer Leagues. League-specific dates and registration details will be announced on each league page.<br /><br />The <b>Number 1</b> ranked contestant in each League is guaranteed a place in the Xeno Championship Finals stage.</p>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-medal" style="margin-right: 0.5rem;"></i> League Format</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt">Each league is played entirely in a <b>Swiss-style format</b>. There is no single-elimination stage or playoff bracket; all contestants remain in the league standings throughout the scheduled rounds.</p>
                <ul>
                    <li>A league may include up to <b>10 rounds</b>, typically one fixture per week within a ten week period</li>
                    <li>Contestants are paired with opponents on similar records where possible</li>
                    <li>Final standings are based on results across the league's scheduled fixtures</li>
                </ul>
                <p class="para-txt">The contestant ranked first at the end of the league is the League Champion. The next highest-ranked contestants take the remaining podium places.</p>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-gamepad" style="margin-right: 0.5rem;"></i> Fixtures and Match Rules</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt">Each fixture is a <b>1v1, best-of-three series</b> in Xeno Arena. The first contestant to win two battles wins the fixture.</p>
                <p class="para-txt">Before their first fixture, contestants must submit a Companion Declaration covering each Companion's name, class, affinity, health, agility, and combat values and classes. The declared roster is locked for the duration of the league; undeclared Companions may not be used.</p>
                <p class="para-txt">Each fixture is overseen by an assigned Umpire, who helps coordinate the match, observes it, and confirms the result. At least one contestant must be able to stream the fixture live on Twitch or provide a full recording upon request. Live streaming is encouraged.</p>
                <p class="para-txt">Fixtures take place in a shared No Man's Sky session arranged by the Umpire. Contestants must follow the Umpire's instructions and report results promptly.</p>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-star" style="margin-right: 0.5rem;"></i> Scoring and Standings</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt">A fixture win adds a Match Win to a contestant's record; a loss adds a Match Loss. A No Show is recorded as a loss for the absent contestant.</p>
                <p class="para-txt">Contestants are ranked first by total Match Wins. Ties are resolved using <b>Opponent Match Win Percentage (OMW%)</b>, which reflects the match-win percentage of their opponents over the league.</p>
                <p class="para-txt">Every scheduled round contributes to the final standings. No contestant is eliminated before the league concludes.</p>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-calendar" style="margin-right: 0.5rem;"></i> Scheduling</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt">Leagues generally run for just over two months, with one fixture scheduled each week and up to 10 rounds. The organizer will publish each league's exact dates and fixture windows.</p>
                <p class="para-txt">Contestants are responsible for coordinating a fixture time with their opponent within each round's window and must be ready at the agreed time. A <b>15-minute grace period</b> applies; failure to attend may result in a No Show loss.</p>
                <p class="para-txt">Umpires will assist with scheduling through Discord. Contestants must remain responsive and complete all assigned fixtures within the published windows.</p>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-user-plus" style="margin-right: 0.5rem;"></i> Registration and Participation</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt">There is no fixed entrant limit or registration fee. Registration windows and instructions will be announced for each league; contestants should use the registration link on that league's page when available.</p>
                <p class="para-txt">By registering, contestants agree to participate throughout the league, coordinate fixtures through Discord, and follow Umpire instructions. They must have a stable connection, access to No Man's Sky multiplayer, and a valid Friend Code.</p>
                <p class="para-txt">All contestants are expected to compete fairly and respect their opponents, Umpires, and organizers. Cheating, use of save edits or mods, unsportsmanlike conduct, or repeated disruption may result in penalties or removal from the league.</p>
            </div>
        </div>
    `;
    if (shouldNavigate) {
        navigateToPage('rules');
    }
}

function navigateToChampionshipRulesPage() {
    populateRulesPage();
    navigateToPage('rules');
}

function populateRulesPage() {
    const rulesPage = document.getElementById('page-rules');
    pageNames.rules = 'Championship Rules';
    if (rulesPage.classList.contains('active')) {
        updatePageTitle('rules');
    }
    rulesPage.innerHTML = `
        <div class="ruleset-switch" role="group" aria-label="Choose rules">
            <button type="button" class="ruleset-switch-button" aria-pressed="true" onclick="populateRulesPage()"><i class="fas fa-trophy" aria-hidden="true"></i> Championship Rules</button>
            <button type="button" class="ruleset-switch-button" aria-pressed="false" onclick="populateLeagueRulesPage()"><i class="fas fa-calendar-alt" aria-hidden="true"></i> League Rules</button>
        </div>
        <h1>Championship Rules</h1>
        <div class="card hero-card">
            <img src="https://www.nomanssky.com/media/rx0bsrqh/battleshots35.jpg" alt="Xeno Championship Image" class="home-hero-image-secondary">
        </div>
        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-medal" style="margin-right: 0.5rem;"></i> Tournament Format</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt" style="margin-bottom: 1rem;">The Xeno Championship features up to <b>8 contestants</b>, competing across two stages for the title of <b>Xeno Champion</b>. The tournament is designed to reward consistent performance across multiple rounds, culminating in a high-stakes elimination Finals.</p>
                <h3 style="margin-bottom: 0.5rem;">Qualification Stage (Swiss Format)</h3>
                <p class="para-txt">All registered contestants begin in the Qualification stage, which follows a <b>Swiss-style format</b> over the course of <b>5 rounds</b>.</p>
                <ul>
                    <li>In each round, players are paired against opponents with similar records</li>
                    <li>Contestants accumulate wins and losses across all rounds</li>
                    <li>At the conclusion of Round 5, players are ranked based on their overall performance</li>
                </ul>
                <p class="para-txt" style="margin-bottom: 1rem;">The <b>top 4 ranked contestants</b> advance to the Finals stage.</p>
                <p class="para-txt">In the event of tied records, semi-final Qualification standings are determined using <b>Opponent Match Win Percentage (OMW%)</b>, as outlined in the Scoring System section.</p>
                <h3 style="margin-bottom: 0.5rem;">Finals Stage (Single Elimination)</h3>
                <p class="para-txt">The top 4 contestants from the Qualification stage progress to the Finals, which follow a <b>single-elimination knockout format</b>.</p>
                <ul>
                    <li>Semi-Finals determine the finalists and third-place contenders</li>
                    <li>A <b>Third Place Match</b> is played to determine the Bronze Medalist</li>
                    <li>The <b>Grand Final</b> determines the Xeno Champion and Silver Medalist</li>
                </ul>
                <h3 style="margin-bottom: 0.5rem;">Final Standings</h3>
                <p class="para-txt">The tournament concludes with the following placements:</p>
                <ul style="margin-bottom: 0;">
                    <li><b>1st Place</b> - Xeno Champion</li>
                    <li><b>2nd Place</b> - Silver Medalist</li>
                    <li><b>3rd Place</b> - Bronze Medalist</li>
                </ul>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-gamepad" style="margin-right: 0.5rem;"></i> Fixture Format</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt">Each fixture in the Xeno Championship is played as a <b>1v1, best-of-three series</b> within the Xeno Arena.</p>
                <ul>
                    <li>The first contestant to achieve <b>two (2) Xeno Arena victories</b> is awarded the fixture win</li>
                    <li>Each individual Xeno Arena battle counts as one game within the best-of-three series</li>
                </ul>
                <h3 style="margin-bottom: 0.5rem;">Streaming Requirements</h3>
                <p class="para-txt">To support event coverage and broadcasting, <b>each fixture must be captured</b> through one of the following methods:</p>
                <ul>
                    <li><b>At least one contestant must stream the fixture live on Twitch</b>, or</li>
                    <li>The fixture must be <b>recorded in full</b> and made available upon request</li>
                </ul>
                <p class="para-txt">Live streaming is strongly encouraged, and <b>required in the case of fiixtures in this Finals stage</b>.</p>
                <h3 style="margin-bottom: 0.5rem;">Umpire Oversight</h3>
                <p class="para-txt" style="margin-bottom: 1rem;">Each fixture is assigned a <b>tournament Umprire</b>, whose role it is to oversee and validate the match.</p>
                <p class="para-txt">The Umpire is responsible for:</p>
                <ul>
                    <li>Assisting and recording fixture scheduling via Discord</li>
                    <li>Ensuring both contestants are present and ready to begin</li>
                    <li>Facilitating player connection using NMS Friend Codes</li>
                    <li>Observing the entire fixture for legitimacy</li>
                    <li>Confirming and recording the final result</li>
                </ul>
                <h3 style="margin-bottom: 0.5rem;">Match Coordination</h3>
                <p class="para-txt">To ensure fixtures run smoothly:</p>
                <ul>
                    <li>Umpires will use <b>No Man's Sky Friend Codes</b> to invite both contestants to the same group</li>
                    <li>Fixtures are to take place within a shared session in the Space Anomaly to ensure consistency</li>
                    <li>Contestants must follow all instructions provided by the Umpire, with respect to initiating and completing the fixture</li>
                </ul>
                <h3 style="margin-bottom: 0.5rem;">Result Reporting</h3>
                <p class="para-txt">Upon completion of a fixture:</p>
                <ul>
                    <li>The result must be <b>confirmed by the Umpire</b></li>
                    <li>Results are then recorded and reflected in the tournament standings</li>
                </ul>
                <p class="para-txt">In the event of a dispute or uncertainty, the Umpire's report will be used as the primary reference, supported by any available stream or recorded footage.</p>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-meteor" style="margin-right: 0.5rem;"></i> Match Rules</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt">Prior to the start of each Fixture, both contestants must submit a Companion Declaration via the provided submission form. This declaration confirms the Companions that the contestant intends to use throughout the entirety of the Fixture.</p>
                <h3 style="margin-bottom: 0.5rem;">Companion Declaration</h3>
                <p class="para-txt">Each Companion Declaration must include the following information for every declared Companion:</p>
                <ul style="font-size: 18px; margin-bottom: 0;">
                    <li>Companion Name</li>
                    <li>Companion Class</li>
                    <li>Companion Affinity</li>
                    <li>Health Value and Class</li>
                    <li>Agility Value and Class</li>
                    <li>Combat Value and Class</li>
                </ul>
                <h3 style="margin-bottom: 0.5rem;">Battle Order</h3>
                <p class="para-txt" style="margin-bottom: 1rem;">Once submitted, a contestant’s declared Companion roster becomes locked for the duration of the stage. Contestants may freely switch between their declared Companions throughout individual Matches, as permitted by the standard Xeno Arena mechanics, however undeclared Companions may not be used under any circumstances.</p>
                <p class="para-txt">The only exception to this is when entering the Finals stage, at which point one companion substitution can be made for that stage (either being use straight away in a Semi-Final, or being banked for the Grand Final or Third Place Match).</p>
                <h3 style="margin-bottom: 0.5rem;">Reasoning</h3>
                <p class="para-txt">The Companion Declaration system exists for two primary reasons:</p>
                <ol style="font-size: 18px;">
                    <li>To assist Umpires in monitoring Fixtures and ensuring fair play.</li>
                    <li>To provide accurate Companion information for use in live broadcasts, commentary, and recorded match presentations.</li>
                </ol>
                <p class="para-txt" style="margin-bottom: 1rem;">All submitted Companion Declarations remain private and confidential until required for official tournament use. This helps preserve competitive integrity by preventing contestants from directly counter-picking opponents prior to a Fixture taking place.</p>
                <p class="para-txt">While contestants may still review publicly available footage from previous Fixtures, there is no guarantee that an opponent will reuse the same Companion lineup in future rounds.</p>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-star" style="margin-right: 0.5rem;"></i> Scoring System</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt">During the Qualification stage, contestants are ranked based on their performance across all fixtures. Rankings are used to determine both <b>advancement to the Finals and seeding for the knockout stage.</b></p>
                <h3 style="margin-bottom: 0.5rem;">Match Results</h3>
                <p class="para-txt">Each fixture contributes to a contestant's overall record as follows:</p>
                <ul class="scoring-list">
                    <li><i class="fas fa-plus-circle" style="color: green;"></i> <b>Win</b> - Match Win</li>
                    <li><i class="fas fa-times-circle" style="color: red;"></i> <b>Loss</b> - Match Loss</li>
                    <li><i class="fas fa-times-circle" style="color: orange;"></i> <b>No Show</b> - Recorded as a Match Loss for the absent contestant</li>
                </ul>
                <p class="para-txt">A No Show is defined as a contestant failing to be present and ready to begin their fixture within <b>15 minutes</b>of the agreed start time.</p>
                <h3 style="margin-bottom: 0.5rem;">Standings & Rankings</h3>
                <p class="para-txt">At the conclusion of the Qualification stage:</p>
                <ul>
                    <li>Contestants are ranked primarily by <b>total Match Wins</b></li>
                    <li>The <b>top 4 ranked contestants</b> advance to the Finals</li>
                </ul>
                <h3 style="margin-bottom: 0.5rem;">Tiebreakers</h3>
                <p class="para-txt">In the event that two or more contestants have the same number of Match Wins, ties are resolved using the following tiebreaker:</p>
                <ul>
                    <li><b>Opponent Match Win Percentage (OMW%)</b></li>
                </ul>
                <p class="para-txt">OMW% represents the average Match Win percentage of a contestant's opponents, and is used to reflect the relative strength of their schedule throughout the Qualification stage.</p>
                <h3 style="margin-bottom: 0.5rem;">Finals Seeding</h3>
                <p class="para-txt">Final standings from the Qualification stage are used to determine seeding for the Finals bracket.</p>
                <ul>
                    <li>Higher-seeded contestants are matched against lower-seeded contestants in the Semi-Finals</li>
                    <li>Seeding is based on <b>Match Wins</b>, with <b>OMW% used as a tiebreaker</b> where required</li>
                </ul>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-calendar" style="margin-right: 0.5rem;"></i> Event Scheduling</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt" style="margin-bottom: 1rem;">The Xeno Championship takes place throughout the month of ${tournamentMonth} and is divided into two scheduling formats: a flexible, player coordinated Qualification stage, followed by a fixed scheduling for the Finals.</p>
                <h3 style="margin-bottom: 0.5rem;">Qualification Stage Scheduling</h3>
                <p class="para-txt" style="margin-bottom: 1rem;">As the Qualification stage is played over 5 rounds, each round takes place within a <b>4-day match window</b>.</p>
                <p class="para-txt">Prior to the start of each round, fixtures will be generated and shared with contestants. Players are then required to <b>coordinate with their assigned opponent to agree on a specific date and time</b> for their match within the allotted window.</p>
                <ul>
                    <li>For <b>Round 1</b>, all fixtures must be scheduled <b>before the tournament begins</b>. Failure to do so may result in forfeiture of a contestant's place in the tournament.</li>
                    <li>For subsequent rounds, a <b>2-day scheduling period</b> is provided between rounds to allow players to arrange their next fixture.</li>
                </ul>
                <p class="para-txt" style="margin-bottom: 1rem;">While an assigned Umpire will assist in facilitating scheduling via Discord, <b>the responsibility ultimately lies with both contestants</b> to communicate promptly and confirm a suitable date and time within the given timeframe.</p>
                <p class="para-txt" style="margin-bottom: 1rem;">Failure to schedule or complete a fixture within the allotted window may result in a forfeit, and recorded as a <b>Fixture No Show</b>.</p>
                <h3 style="margin-bottom: 0.5rem;">Finals Scheduling</h3>
                <p class="para-txt">The Finals stage follows a <b>fixed schedule</b> and takes place across two days:</p>
                <ul>
                    <li><b>30th ${tournamentMonth}</b> - Semi-Finals (Top 4)</li>
                    <li><b>31st ${tournamentMonth}</b> - Third Place Match, and Grand Final</li>
                </ul>
                <p class="para-txt" style="margin-bottom: 1rem;">Due to broadcast and production requirements, all Finals fixtures must be played at their assigned times and are expected to be <b>live streamed on Twitch</b>.</p>
                <p class="para-txt">Each day will attempt to follow a structured schedule:</p>
                <ul>
                    <li>11:00 - 12:00 (Fixture 1)</li>
                    <li>13:00 - 14:00 (Fixture 2)</li>
                    <li>15:00 - 16:00 (Fixture 3)</li>
                    <li>17:00 - 18:00 (Fixture 4)</li>
                </ul>
                <h3 style="margin-bottom: 0.5rem;">Player Availability</h3>
                <p class="para-txt">By registering for the Xeno Championship, contestants are expected to:</p>
                <ul>
                    <li>Be available to schedule fixtures within the 2-day scheduling window</li>
                    <li>Be available to complete scheduled fixtures within the 4-day match window</li>
                    <li>Be fully available on <b>30th and 31st ${tournamentMonth}</b> if they qualify for Finals</li>
                </ul>
                <p class="para-txt">Failure to meet these availability requirements may result in match forfeiture.</p>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-user-plus" style="margin-right: 0.5rem;"></i> Registration Process</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <p class="para-txt" style="margin-bottom: 1rem;">Participartion in the Xeno Championship is limited to <b>8 contestants</b>, with places being allocated on a <b>first come, first serve</b> basis.</p>
                <p class="para-txt">There is <b>no registration fee</b> required to enter.</p>
                <h3 style="margin-bottom: 0.5rem;">Registration Window</h3>
                <p class="para-txt" style="margin-bottom: 1rem;">Registration will open automatically on <b>the first day of the month prior to the tournament</b> and will close <b>the day before the tournament begins</b>.</p>
                <p class="para-txt">Once registration is open, a <b>"Register Now"</b> button will become available on the tournament's main page.</p>
                <h3 style="margin-bottom: 0.5rem;">How to Register</h3>
                <p class="para-txt">To register for the Xeno Championship:</p>
                <ol>
                    <li>Click the <b>"Register Now"</b> button on the main page</li>
                    <li>Complete the registration form with the required details</li>
                    <li>Join the official Discord server (if not already a member)</li>
                </ol>
                <p class="para-txt">Following submission, contestants will be contacted via Discord to <b>confirm their registration and secure their place</b> in the tournament.</p>
                <h3 style="margin-bottom: 0.5rem;">Important Information</h3>
                <p class="para-txt">Before registering, contestants are strongly advised to:</p>
                <ul>
                    <li>Review the <b>Event Scheduling</b> section</li>
                    <li>Review the <b>Participation Requirements</b> section</li>
                </ul>
                <p class="para-txt">By registering, contestants confirm that they:</p>
                <ul>
                    <li>Are available to compete within the tournament schedule</li>
                    <li>Are able to communicate and coordinate fixtures via Discord</li>
                    <li>Intend to participate fully for the duration of the event</li>
                </ul>
                <p class="para-txt">Failure to meet these expectations may result in removal from the tournament or forfeiture of fixtures.</p>
            </div>
        </div>

        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2 class="para-h1"><i class="fas fa-triangle-exclamation" style="margin-right: 0.5rem;"></i> Participation Requirements</h2>
                <span class="accordion-icon"><i class="fas fa-chevron-down"></i></span>
            </button>
            <div class="accordion-rule-content">
                <h3 style="margin-bottom: 0.5rem; margin-top: 0;">Eligibility & Commitment</h3>
                <p class="para-txt" style="margin-bottom: 1rem;">By registering for the Xeno Championship, contestants agree to actively participate in the tournament for its full duration.</p>
                <p class="para-txt">Contestants must be able to:</p>
                <ul>
                    <li>Compete in scheduled fixtures withiin each round's allotted time window</li>
                    <li>Remain responsive and communicative throughout the tournament</li>
                    <li>Commit to completing all assigned fixtures unless prevented by exceptional circumstances</li>
                </ul>
                <p class="para-txt">Failure to meet these expectations may result in fixture forfeiture or removal from the tournament.</p>
                <h3 style="margin-bottom: 0.5rem;">Communication Requirements</h3>
                <p class="para-txt">All contestants must:</p>
                <ul>
                    <li>Be a member of the official Discord server</li>
                    <li>Monitor Discord regularly for updates, fixture coordination, and announcements</li>
                    <li>Respond to scheduling messages from opponents and Umpires in a timely manner</li>
                </ul>
                <p class="para-txt">Clear and consistent communication is essential to ensure the tournament runs smoothly.</p>
                <h3 style="margin-bottom: 0.5rem;">Match Coordination</h3>
                <p class="para-txt">Contestants are responsible for:</p>
                <ul>
                    <li>Coordinating fixture times with their assigned opponent within each round's scheduling window</li>
                    <li>Being present and ready to begin at the agreed fixture time</li>
                    <li>Following any instructions provided by the assigned Umpire</li>
                </ul>
                <p class="para-txt">A <b>15 minute grace period</b> is allowed from the scheduled start time. Failure to attend within this period may result in a <b>fixture loss by No Show</b>.</p>
                <h3 style="margin-bottom: 0.5rem;">Streaming & Recording Requirements</h3>
                <p class="para-txt">To ensure match verification and event coverage:</p>
                <ul>
                    <li>At least one contestant per fixture must be capable of <b>streaming the match live on Twitch</b> or</li>
                    <li>Providing a <b>full recording of the fixture upon request</b></li>
                </ul>
                <p class="para-txt" style="margin-bottom: 1rem;">When streaming or submitting recordings of any fixture, both contestant's names must be visible at the top of the screen and not covered in any way by any ovelay graphics.</p>
                <p class="para-txt">While live streaming is highly encouraged, and specifically required for Finals fixtures, the primary requirement is that <b>match footage can be reviewed if necessary</b>.</p>
                <h3 style="margin-bottom: 0.5rem;">Technical Requirements</h3>
                <p class="para-txt">Contestants must have:</p>
                <ul>
                    <li>A stable internet connection capable of completing online matches</li>
                    <li>Access to No Man's Sky multiplayer functionality</li>
                    <li>A valid No Man's Sky Friend Code for match coordination</li>
                </ul>
                <p class="para-txt">Contestants are responsible for ensuring their setup is functional prior to their scheduled fixtures.</p>
                <h3 style="margin-bottom: 0.5rem;">Conduct & Fair Play</h3>
                <p class="para-txt">All contestants are expected to:</p>
                <ul>
                    <li>Compete fairly and in good spirit</li>
                    <li>Respect opponents, Umpires and tournament organisers</li>
                    <li>Follow all tournament rules and instructions</li>
                </ul>
                <p class="para-txt">Unsportsmanlike behaviour, exploitation of unintended mechanics (including usage of <i>save edits</i> or <i>mods</i>), or repeated event disruption may result in penalties, disqualification, or removal from the tournament.</p>
                <h3 style="margin-bottom: 0.5rem;">Finals Availability</h3>
                <p class="para-txt">Contestants who qualify for the Finals must be fully available on:</p>
                <ul>
                    <li><b>30th ${tournamentMonth}</b> for Semi-Finals</li>
                    <li><b>31st ${tournamentMonth}</b> for Third Place Match, and Grand Final</li>
                </ul>
                <p class="para-txt">As Finals fixtures follow a fixed schedule and are broadcast-focused, failure to attend may result in forfeiture.</p>
            </div>
        </div>
    `;
}

function populateUmpiresPage() {
    const umpiresPage = document.getElementById('page-umpires');
    umpiresPage.innerHTML = `
        <h1>Become an Umpire</h1>
        <div class="card hero-card">
            <img src="https://www.nomanssky.com/media/rx0bsrqh/battleshots35.jpg" alt="Xeno Championship Image" class="home-hero-image-secondary">
        </div>
        <div class="card">
            <h2 class="para-h1"><i class="fas fa-gavel" style="margin-right: 0.5rem;"></i> What is an Umpire?</h2>
            <p class="para-txt" style="margin-bottom: 1rem;">Umpires are essential volunteers who ensure fair play and uphold the integrity of the Xeno Championship. They oversee matches, enforce rules, and provide a smooth experience for all participants.</p>
            <p class="para-txt">As an Umpire, you'll play a crucial role in maintaining the competitive spirit of the tournament while supporting our community-driven event.</p>
        </div>
        <div class="card-row two-cards">
            <div class="card home-card-single" style="margin: 0; padding: 0; overflow: hidden;">
                <img src="https://www.nomanssky.com/media/f5ej53x4/spectators39.png" alt="Xeno Arena gameplay" class="home-hero-image-secondary">
            </div>
            <div class="card" style="margin: 0;">
                <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary-color);">
                    <i class="fas fa-video"></i>
                </div>
                <h2 class="para-h1">Umpire Responsibilities</h2>
                <ul class="para-ul">
                    <li><strong><i class="fas fa-check-circle"></i> Match Oversight:</strong> Monitor live fixtures and ensure compliance with championship rules.</li>
                    <li><strong><i class="fas fa-clock"></i> Time Management:</strong> Keep matches on schedule and handle any timing issues.</li>
                    <li><strong><i class="fas fa-balance-scale"></i> Fair Play Enforcement:</strong> Address rule violations and maintain sportsmanship.</li>
                    <li><strong><i class="fas fa-comments"></i> Communication:</strong> Coordinate with players, organizers, and spectators as needed.</li>
                    <li><strong><i class="fas fa-file-alt"></i> Reporting:</strong> Document match results and any incidents for tournament records.</li>
                    <li><strong><i class="fas fa-users"></i> Community Support:</strong> Assist with tournament logistics and help create a positive environment.</li>
                </ul>
            </div>
        </div>
        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2>Umpire Code of Conduct</h2>
                <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-rule-content">
                <ul class="para-ul" style="margin-top: 0; margin-bottom: 0; list-style: initial; padding-left: 1.5rem;">
                    <li><strong>Integrity:</strong> Act with honesty and impartiality in all decisions.</li>
                    <li><strong>Confidentiality:</strong> Respect player privacy and tournament information.</li>
                    <li><strong>Professionalism:</strong> Communicate respectfully with all participants.</li>
                    <li><strong>Punctuality:</strong> Be available and on time for assigned matches.</li>
                    <li><strong>Knowledge:</strong> Stay informed about current rules and procedures.</li>
                    <li><strong>Teamwork:</strong> Collaborate effectively with other umpires and organizers.</li>
                </ul>
            </div>
        </div>
        <div class="card accordion-rule-card">
            <button class="accordion-rule-toggle" onclick="toggleRuleAccordion(this)">
                <h2>Umpire Training and Requirements</h2>
                <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-rule-content">
                <ul class="para-ul" style="margin-top: 0; margin-bottom: 0; list-style: initial; padding-left: 1.5rem;">
                    <li><strong>Training:</strong> Complete mandatory training sessions before officiating.</li>
                    <li><strong>Game Knowledge:</strong> Familiarity with No Man's Sky and Xeno Arena mechanics.</li>
                    <li><strong>Technical Setup:</strong> Reliable internet connection and appropriate hardware.</li>
                    <li><strong>Communication Skills:</strong> Clear verbal communication in English.</li>
                    <li><strong>Availability:</strong> Commitment to tournament schedule and potential practice sessions.</li>
                    <li><strong>Discord Access:</strong> Active participation in our Discord server for coordination.</li>
                </ul>
            </div>
        </div>
        <div class="card">
            <h2 class="para-h1"><i class="fas fa-clipboard-list" style="margin-right: 0.5rem;"></i> How to Apply</h2>
            <p class="para-txt" style="margin-bottom: 1rem;">Interested in becoming an Umpire? Submit your interest through our online registration form. Please note that completing the form expresses your interest in the role.</p>
            <p class="para-txt" style="margin-bottom: 1rem;"><strong>Important:</strong> Umpire status is confirmed only after direct approval by an Organizer via Discord. We'll contact you through our server to discuss next steps and training.</p>
            <div class="home-card-buttons">
                <a class="btn site-btn" href="https://tally.so/r/81jZZ5" target="_blank" rel="noopener">Register Interest</a>
                <a class="btn site-btn" href="https://dc.gg/xenochampionship" target="_blank" rel="noopener">Join Discord</a>
            </div>
        </div>
    `;
}

function populateHomePage(data, record) {
    const homePage = document.getElementById('page-home');
    homePage.innerHTML = `
        <div class="hero-overlay" style="background-image: url('https://www.nomanssky.com/media/eohnnwwy/no-mans-sky-xeno-arena-screenshot-3-5mb.jpg');">
            <div class="hero-overlay-content">
                <h1 style="font-size: 3.5rem; margin: 0 0 1.5rem 0; text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);">Enter the Xeno Arena</h1>
                <p style="font-size: 1.3rem; max-width: 600px; margin-bottom: 2rem; text-shadow: 0 0 15px rgba(0, 0, 0, 0.8); line-height: 1.6;">The Xeno Championship blends fan-fueled passion with community-run organized competition. Interlopers face off in 1v1 Xeno Arena fixtures across Swiss-style Qualification rounds, with the top four advancing to the Finals. Every battle is important and all in aid of Cancer Research UK.</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <button class="btn site-btn" style="flex: 1;" onclick="navigateToPage('championship')"><i class="fas fa-info-circle"></i> About the Championship</button>
                    <button class="btn site-btn" style="flex: 1;" onclick="navigateToPage('current')"><i class="fas fa-trophy"></i> View Championship</button>
                </div>
            </div>
        </div>

        <div class="card-row two-cards">
            <div class="card" style="margin: 0;">
                <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary-color);">
                    <i class="fas fa-crown"></i>
                </div>
                <h2 class="para-h1">Hall of Fame</h2>
                <p class="para-txt" style="margin-bottom: 1rem;">Those who compete in the Xeno Championship and win the Grand Final, attaining the title of Xeno Champion, are immortalised in our online Hall of Fame. Along with to championship title, Xeno Champions are also guaranteed a spot in the next year's tournament if they wish.</p>
                <p class="para-txt" style="margin-bottom: 1rem;">For contestants who make it into the top 3 in the Finals, they are also listed in our Past Results page. This page shows the top 3 contestants from all of the previous Xeno Championship events.</p>
                <button class="btn site-btn" onclick="navigateToPage('hof')" style="margin-top: auto;">View Hall of Fame</button>
            </div>
            <div class="card home-card-single" style="margin: 0; padding: 0; overflow: hidden;">
                <img src="https://www.nomanssky.com/media/rx0bsrqh/battleshots35.jpg" alt="Xeno Arena gameplay" class="home-hero-image-secondary">
            </div>
        </div>

        ${renderHomeDonationSection(record, data?.metadata)}
        ${renderHomeLeagueDonationSection()}

        <div class="card-row two-cards">
            <div class="card home-card-single" style="margin: 0; padding: 0; overflow: hidden;">
                <img src="https://www.nomanssky.com/media/f5ej53x4/spectators39.png" alt="Xeno Arena gameplay" class="home-hero-image-secondary">
            </div>
            <div class="card" style="margin: 0;">
                <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary-color);">
                    <i class="fas fa-video"></i>
                </div>
                <h2 class="para-h1">Broadcast Coverage</h2>
                <p class="para-txt" style="margin-bottom: 1rem;">Live and recorded highlights of Qualification fixtures are re-streamed on the official Xeno Championship Twitch channel, showing the full range of dynamic Xeno Arena tournament fixtures.</p>
                <p class="para-txt" style="margin-bottom: 1rem;">During the Finals all fixtures are live streamed and can be viewed live on our official Twitch, enabling a high stakes tournament Finals stage, ending with an annual Bronze and Silver medalist and ultimately the tournament's Xeno Champion.</p>
                <div class="home-card-buttons">
                    <a class="btn site-btn" href="https://m.twitch.tv/xenochampionship/" target="_blank" rel="noopener">Twitch Channel</a>
                    <a class="btn site-btn" href="https://www.youtube.com/@XenoChampionship" target="_blank" rel="noopener">YouTube Channel</a>
                </div>
            </div>
        </div>

        <div class="card home-card-single">
            <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary-color);">
                <i class="fas fa-users"></i>
            </div>
            <h2 class="para-h1">Community Engagement</h2>
            <p class="para-txt" style="margin-bottom: 1rem;">This is a fan-driven event built for the No Man's Sky community. Whether you compete, spectate, or help organise, the championship aims to connects players across the world with shared rules, scheduled fixtures, and a focus on fair play and mutual support.</p>
            <div class="home-card-buttons">
                <a class="btn site-btn" href="https://x.com/NMSXenoChamp" target="_blank" rel="noopener">Twitter (X)</a>
                <a class="btn site-btn" href="https://dc.gg/xenochampionship" target="_blank" rel="noopener">Discord Server</a>
            </div>
        </div>
    `;
}

function populateHallOfFame(loadedLeagues = []) {
    const hofPage = document.getElementById('page-hof');
    const pastRecords = records.filter(r => r.past).slice().sort((a, b) => getRecordYear(b) - getRecordYear(a));
    const pastLeagueRecords = loadedLeagues
        .filter(({ definition, data }) => getLeagueStatus(definition, data).key === 'past')
        .map(({ definition, data }) => ({ definition, data }))
        .filter(({ definition, data }) => {
            return getLeaguePodium(definition, data).some(isRecordedPodiumName);
        })
        .sort((a, b) => getRecordYear(b.definition) - getRecordYear(a.definition));

    const championshipContent = pastRecords.length > 0
        ? `<div class="hof-grid">
            ${pastRecords.map(record => `
                <div class="card hof-winner-card">
                    <div class="hof-year">${record.title}</div>
                    <div class="hof-winner-badge"><i class="fas fa-trophy" style="color: rgb(251 171 0);"></i></div>
                    <div class="hof-winner-name">${record.top3[0]}</div>
                    <div class="hof-winner-label">Champion</div>
                </div>
            `).join('')}
        </div>`
        : `<div class="card hof-empty-card">
            <i class="fas fa-trophy" aria-hidden="true"></i>
            <h3>Champions will be immortalized here</h3>
            <p class="para-txt">Completed Xeno Championship winners will be celebrated here first.</p>
        </div>`;

    const leagueContent = pastLeagueRecords.length
        ? `<div class="hof-league-grid">
            ${pastLeagueRecords.map(({ definition, data }) => {
                const podium = getLeaguePodium(definition, data);
                const places = [
                    { position: '1st', name: podium[0], label: 'League Champion', className: 'gold' },
                    { position: '2nd', name: podium[1], label: 'Runner-up', className: 'silver' },
                    { position: '3rd', name: podium[2], label: 'Third Place', className: 'bronze' }
                ];
                return `
                    <div class="card hof-league-card">
                        <div class="hof-league-heading">
                            <h3>${definition.title}</h3>
                            <span class="league-status-badge past">Past League</span>
                        </div>
                        <div class="hof-league-podium">
                            ${places.map(place => `
                                <div class="hof-league-place ${place.className}">
                                    <span class="hof-league-position">${place.position}</span>
                                    <strong>${isRecordedPodiumName(place.name) ? place.name : 'Not recorded'}</strong>
                                    <span>${place.label}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>`
        : `<div class="card hof-empty-card hof-league-empty">
            <i class="fas fa-medal" aria-hidden="true"></i>
            <p class="para-txt">Past League podiums will appear here after an edition is marked as past and its results are recorded.</p>
        </div>`;

    hofPage.innerHTML = `
        <h1>Hall of Fame</h1>
        <p class="hof-subtitle para-txt">Celebrating the champions and podium finishers across the Xeno Championship and seasonal Leagues.</p>
        <section class="hof-section">
            <h2 class="para-h1">Xeno Championship</h2>
            ${championshipContent}
        </section>
        <section class="hof-section">
            <h2 class="para-h1">League Podiums</h2>
            ${leagueContent}
        </section>
    `;
}

function isRecordedPodiumName(name) {
    return typeof name === 'string' && name.trim() !== '' && name.trim() !== '#' && name.trim().toLowerCase() !== 'tbc';
}

function getLeaguePodium(definition, data) {
    const metadataPodium = data?.metadata?.podium;
    if (Array.isArray(metadataPodium) && metadataPodium.some(isRecordedPodiumName)) {
        return metadataPodium;
    }
    return Array.isArray(definition.podium) ? definition.podium : [];
}

function setupPastResultsSelector() {
    const resultsPage = document.getElementById('page-results');
    const pastRecords = records.filter(r => r.past);
    const sortedPastRecords = pastRecords.slice().sort((a, b) => getRecordYear(b) - getRecordYear(a));

    if (sortedPastRecords.length === 0) {
        resultsPage.innerHTML = `
            <h1>Past Results</h1>
            <div class="card" style="text-align: center; padding: 2rem;">
                <i class="fas fa-history" style="font-size: 4rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                <h2 class="para-h1" style="margin-bottom: 1rem;">Past Tournament Results</h2>
                <p class="para-txt">Detailed results from completed Xeno Championship tournaments will be available here.<br><br>Check back after the completion of future tournaments to view the top 3 contestants of each Xeno Championship.</p>
            </div>
        `;
        return;
    }

    resultsPage.innerHTML = `
        <h1>Past Results</h1>
        <div class="card pr-search-card">
            <label for="past-select" class="pr-search-label">Select Championship</label>
            <select id="past-select" class="select pr-search-select">
                <option value="">Choose a championship...</option>
                ${sortedPastRecords.map((record, index) => `<option value="${index}">${record.title}</option>`).join('')}
            </select>
        </div>
        <div id="past-results"></div>
    `;

    const resultsDiv = document.getElementById('past-results');
    resultsDiv.innerHTML = renderAllPastRecords(sortedPastRecords);

    document.getElementById('past-select').addEventListener('change', function() {
        const index = this.value;
        if (index !== '') {
            showPastResults(sortedPastRecords[index]);
        } else {
            resultsDiv.innerHTML = renderAllPastRecords(sortedPastRecords);
        }
    });
}

function sortPlayersByStandings(players) {
    return players.slice().sort((a, b) => {
        const winsA = Number(a.results.wins ?? 0);
        const winsB = Number(b.results.wins ?? 0);
        if (winsB !== winsA) return winsB - winsA;

        const omwA = Number(a.results.omw ?? 0);
        const omwB = Number(b.results.omw ?? 0);
        if (omwB !== omwA) return omwB - omwA;

        const playedA = Number(a.results.played ?? 0);
        const playedB = Number(b.results.played ?? 0);
        if (playedB !== playedA) return playedB - playedA;

        return a.name.localeCompare(b.name);
    });
}

function togglePlayerDetails(index, cardIdPrefix = 'player-card') {
    const card = document.getElementById(`${cardIdPrefix}-${index}`);
    if (!card) return;
    card.classList.toggle('expanded');
    const summary = card.querySelector('.player-summary');
    if (summary) {
        summary.setAttribute('aria-expanded', card.classList.contains('expanded') ? 'true' : 'false');
    }
}

function renderPlayerStandings(players, advancingCount = 0, cardIdPrefix = 'player-card') {
    if (!Array.isArray(players) || players.length === 0) {
        return '<div class="card" style="margin-bottom: 0px;"><p class="para-txt">No players registered yet.</p></div>';
    }

    const hasScores = players.some(player => Number(player.results?.wins ?? 0) > 0 || Number(player.results?.played ?? 0) > 0);
    return `
        <div class="standings-accordion">
            ${sortPlayersByStandings(players).map((player, index) => {
                const results = player.results || {};
                return `
                    <div class="player-card${hasScores && index < advancingCount ? ' advancing' : ''}" id="${cardIdPrefix}-${index}">
                        <button class="player-summary" type="button" onclick="togglePlayerDetails(${index}, '${cardIdPrefix}')" aria-expanded="false" style="grid-template-columns: ${hasScores ? 'auto 1fr auto' : '1fr auto'};">
                            ${hasScores ? `<span class="rank-badge">${index + 1}</span>` : ''}
                            <span class="player-title">
                                <span class="player-name">${player.name}</span>
                                <span class="player-platform">${player.platform}</span>
                            </span>
                            <span class="player-stats">
                                <span class="wins">${results.wins ?? 0} Wins</span>
                                <span class="omw">OMW ${results.omw ?? '—'}%</span>
                            </span>
                        </button>
                        <div class="player-details">
                            <div class="detail-row"><span>Played</span><span>${results.played ?? 0}</span></div>
                            <div class="detail-row"><span>Wins</span><span>${results.wins ?? 0}</span></div>
                            <div class="detail-row"><span>Losses</span><span>${results.losses ?? 0}</span></div>
                            ${results.omw !== undefined ? `<div class="detail-row"><span>OMW%</span><span>${results.omw}%</span></div>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

async function populateCurrentChampionship() {
    const currentRecord = records.find(r => !r.past);
    if (!currentRecord) return;

    const currentChampionshipPage = document.getElementById('page-current');

    let data = null;
    if (currentRecord.resultsJson) {
        try {
            const response = await fetch(currentRecord.resultsJson, { cache: 'no-store' });
            data = await response.json();
        } catch (error) {
            console.error('Error loading Current Championship data:', error);
        }
    }

    let fixturesHtml = '';
    let completedFixturesHtml = '<p class="para-txt">No completed fixtures yet.</p>';
    let completedFixturesCount = 0;
    const fixtures = Array.isArray(data?.fixtures) ? data.fixtures : [];
    const completedFixtures = fixtures.filter(fixture => fixture.status === 'completed');
    completedFixturesCount = completedFixtures.length;
    completedFixturesHtml = renderCompletedFixtures(completedFixtures);
    fixturesHtml = renderUpcomingFixtures({ fixtures }, data?.players?.length || 32);
    document.getElementById('current-completed-fixtures-source').innerHTML = completedFixturesHtml;

    const registrationHtml = renderRegistrationCard(currentRecord, data?.metadata);
    const tournamentRange = parseTournamentDateRange(currentRecord.dates);
    const now = new Date();
    const isTournamentActive = tournamentRange && now >= tournamentRange.start && now <= tournamentRange.end;
    const donationOverlayHtml = isTournamentActive
        ? renderDonationCard(currentRecord, data?.metadata, true)
        : '';
    const donationHtml = isTournamentActive ? '' : renderDonationCard(currentRecord, data?.metadata);
    const registrationSection = (registrationHtml || donationHtml)
        ? `<div class="card-row ${registrationHtml && donationHtml ? 'two-cards' : 'one-card'}">${registrationHtml}${donationHtml}</div>`
        : '';
    
    const tournamentName = data?.metadata?.tournamentName || currentRecord.title;

    const advancingCount = data?.players?.length ? 4 : 0;
    const standingsHtml = renderPlayerStandings(data?.players || [], advancingCount);

    currentChampionshipPage.innerHTML = `
        <h1 style="margin-bottom: 0;">${tournamentName}</h1>
        <p class="para-txt" style="margin-top: 0; margin-bottom: 1rem; font-style: italic;">${currentRecord.dates}</p>
        <div class="card hero-card current-championship-hero${donationOverlayHtml ? ' has-donation-overlay' : ''}">
            <img src="https://www.nomanssky.com/media/eegigxne/spectators03.jpg" alt="Xeno Championship Image" class="home-hero-image-secondary">
            ${donationOverlayHtml}
        </div>
        ${registrationSection}
        <div class="card">
            <h2 class="para-h1">Current Standings</h2>
            ${standingsHtml}
        </div>
        <div class="card">
            <div class="fixtures-section-header">
                <h2 class="para-h1">Upcoming Fixtures</h2>
                ${completedFixturesCount ? `<button class="completed-fixtures-trigger" type="button" data-open-completed-fixtures data-completed-fixtures-source="current-completed-fixtures-source" data-completed-fixtures-title="Completed Championship Fixtures">
                    <i class="fas fa-flag-checkered" aria-hidden="true"></i>
                    <span>Completed fixtures</span>
                    <span class="completed-fixtures-count">${completedFixturesCount}</span>
                </button>` : ''}
            </div>
            ${fixturesHtml}
        </div>
        <div class="card podium-card">
            <h2 class="para-h1">Championship Podium</h2>
            <div class="podium-grid">
                <div class="podium-item gold">
                    <span class="medal-badge">1</span>
                    <div>${currentRecord.top3[0]}</div>
                    <div class="podium-label">Xeno Champion</div>
                </div>
                <div class="podium-item silver">
                    <span class="medal-badge">2</span>
                    <div>${currentRecord.top3[1]}</div>
                    <div class="podium-label">Silver Medallist</div>
                </div>
                <div class="podium-item bronze">
                    <span class="medal-badge">3</span>
                    <div>${currentRecord.top3[2]}</div>
                    <div class="podium-label">Bronze Medallist</div>
                </div>
            </div>
        </div>
        <div class="card">
            <h2 class="para-h1">Tournament Information</h2>
            <p class="para-txt"><strong>Format:</strong> 1v1 Best-of-3 Xeno Arena matches</p>
            <p class="para-txt"><strong>Stages:</strong> Swiss Qualification → Top 4 Finals</p>
            <p class="para-txt"><strong>Schedule:</strong> Round completion windows in UK time (UTC+01:00)</p>
            <p class="para-txt"><strong>Streaming:</strong> All Finals matches are streamed, with Qualification highlights throughout ${tournamentMonth}</p>
            <button class="btn site-btn" onclick="navigateToChampionshipRulesPage()" style="margin-top: 1rem;"><i class="fas fa-book"></i> View Full Rules</button>
        </div>
    `;
}

async function populateLeaguePages(definitions) {
    if (!definitions.length) {
        const allLeaguesPage = document.getElementById('page-leagues');
        allLeaguesPage.innerHTML = renderLeagueOverview([]);
        populateHallOfFame([]);
        return;
    }

    const loadedLeagues = await Promise.all(definitions.map(async definition => {
        try {
            const response = await fetch(definition.file, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return { definition, data: await response.json(), error: null };
        } catch (error) {
            console.error(`Error loading ${definition.title} data:`, error);
            return { definition, data: null, error };
        }
    }));

    const allLeaguesPage = document.getElementById('page-leagues');
    allLeaguesPage.innerHTML = renderLeagueOverview(loadedLeagues);
    populateHallOfFame(loadedLeagues);

    const pageRenderers = {
        'league-winter': renderWinterLeaguePage,
        'league-spring': renderSpringLeaguePage,
        'league-summer': renderSummerLeaguePage
    };

    loadedLeagues.forEach(({ definition, data, error }) => {
        const page = document.getElementById(`page-${definition.pageId}`);
        const renderPage = pageRenderers[definition.pageId];
        if (!renderPage) {
            throw new Error(`Missing page renderer for ${definition.title}.`);
        }
        page.innerHTML = renderPage(definition, data, error);
    });
}

function renderLeagueOverview(loadedLeagues) {
    const activeLeague = loadedLeagues.find(({ definition, data }) => getLeagueStatus(definition, data).key === 'active');
    const nextLeague = loadedLeagues.find(({ definition, data }) => getLeagueStatus(definition, data).key === 'upcoming');
    const pastCount = loadedLeagues.filter(({ definition, data }) => getLeagueStatus(definition, data).key === 'past').length;
    const activeHeadline = activeLeague
        ? `${activeLeague.definition.title} is active now.`
        : 'No seasonal League is active right now.';
    const activeDetail = activeLeague
        ? getLeagueStatus(activeLeague.definition, activeLeague.data).detail
        : nextLeague
            ? `${nextLeague.definition.title} is next.`
            : 'Check back for announcements about the next season.';
    const iconBySeason = {
        Winter: 'fa-snowflake fa-icon-winter',
        Spring: 'fa-seedling fa-icon-spring',
        Summer: 'fa-sun fa-icon-summer'
    };
    const leagueCards = loadedLeagues.map(({ definition, data, error }) => {
        const status = getLeagueStatus(definition, data);
        const players = Array.isArray(data?.players) ? data.players : [];
        const fixtures = Array.isArray(data?.fixtures) ? data.fixtures : [];
        const summary = error
            ? 'League data is currently unavailable.'
            : data
                ? `${players.length} contestants · ${fixtures.length} fixtures`
                : 'Season information loading...';
        const dateText = data?.metadata?.dates || status.detail;
        const theme = definition.seasonName.toLowerCase();
        return `
            <article class="card league-season-card ${theme} ${status.key}">
                <div class="league-season-card-top">
                    <span class="league-season-icon"><i class="fas ${iconBySeason[definition.seasonName]}" aria-hidden="true"></i>${definition.seasonName}</span>
                    <span class="league-status-badge ${status.key}">${status.label}</span>
                </div>
                <h3>${definition.title}</h3>
                <p>${definition.description}</p>
                <div class="league-season-meta">
                    <span><i class="fas fa-layer-group" aria-hidden="true"></i> Season ${definition.seasonGroup}</span>
                    <span><i class="fas fa-calendar" aria-hidden="true"></i> ${dateText}</span>
                </div>
                <p class="league-card-summary">${summary}</p>
                <a class="btn site-btn" href="#${definition.pageId}">Explore ${definition.seasonName} League <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
            </article>
        `;
    }).join('');

    return `
        <div class="league-overview">
            <div class="league-overview-hero">
                <div class="league-overview-copy">
                    <span class="league-overview-kicker"><i class="fas fa-compass" aria-hidden="true"></i> The seasonal circuit</span>
                    <h1>Four seasons. One community.</h1>
                    <p>Join the Winter, Spring, and Summer Leagues for year-round competition, then follow the Xeno Championship in Autumn.</p>
                    <button class="btn site-btn" type="button" onclick="populateLeagueRulesPage()"><i class="fas fa-book" aria-hidden="true"></i> Explore League Rules</button>
                </div>
                <div class="league-season-cycle" aria-label="League seasons: Winter, Spring, Summer">
                    <div class="league-cycle-season winter"><i class="fas fa-snowflake fa-icon-winter" aria-hidden="true"></i><span>Winter</span></div>
                    <div class="league-cycle-season spring"><i class="fas fa-seedling fa-icon-spring" aria-hidden="true"></i><span>Spring</span></div>
                    <div class="league-cycle-season summer"><i class="fas fa-sun fa-icon-summer" aria-hidden="true"></i><span>Summer</span></div>
                    <div class="league-cycle-championship"><i class="fas fa-trophy" aria-hidden="true"></i><span>Xeno Championship</span></div>
                </div>
            </div>

            <div class="league-now-banner">
                <span class="league-now-icon"><i class="fas ${activeLeague ? 'fa-bolt' : 'fa-hourglass-half'}" aria-hidden="true"></i></span>
                <div class="league-now-copy">
                    <span class="league-now-label">${activeLeague ? 'Currently active' : 'League status'}</span>
                    <strong>${activeHeadline}</strong>
                    <span>${activeDetail}</span>
                </div>
                <div class="league-now-stats">
                    <span><strong>${pastCount}</strong> past</span>
                    <span><strong>${loadedLeagues.length}</strong> seasons</span>
                </div>
            </div>

            <div class="league-overview-heading">
                <div>
                    <span class="league-overview-kicker">Choose your season</span>
                    <h2>Explore the Leagues</h2>
                </div>
                <p>Swiss-style play throughout · No fixed player limit · No elimination stage</p>
            </div>
            <div class="league-season-grid">
                ${leagueCards || '<div class="card"><p class="para-txt">League editions will be announced soon.</p></div>'}
            </div>
        </div>
    `;
}

function getLeagueStatus(definition, data) {
    const metadata = data?.metadata || {};
    const state = String(metadata.state || metadata.status || definition.status || '').trim().toLowerCase();
    const specialState = state.includes('postpon') ? 'postponed' : state.includes('cancel') ? 'cancelled' : '';
    if (specialState) {
        return {
            key: specialState,
            label: specialState === 'postponed' ? 'Postponed' : 'Cancelled',
            detail: specialState === 'postponed' ? 'The season is postponed.' : 'The season has been cancelled.'
        };
    }

    const dateRange = parseTournamentDateRange(metadata.dates || definition.dates);
    if (dateRange) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateRange.start.setHours(0, 0, 0, 0);
        dateRange.end.setHours(23, 59, 59, 999);
        if (today < dateRange.start) {
            return { key: 'upcoming', label: 'Upcoming', detail: `Starts ${dateRange.start.toLocaleDateString('en-GB')}.` };
        }
        if (today > dateRange.end) {
            return { key: 'past', label: 'Past', detail: `Finished ${dateRange.end.toLocaleDateString('en-GB')}.` };
        }
        return { key: 'active', label: 'Active now', detail: `Runs until ${dateRange.end.toLocaleDateString('en-GB')}.` };
    }

    if (['active', 'in progress', 'ongoing', 'live'].includes(state)) {
        return { key: 'active', label: 'Active now', detail: 'This League is currently underway.' };
    }
    if (['past', 'completed', 'complete', 'finished', 'ended'].includes(state)) {
        return { key: 'past', label: 'Past', detail: 'This season has finished.' };
    }
    if (['upcoming', 'planned', 'scheduled', 'registration open'].includes(state)) {
        return { key: 'upcoming', label: 'Upcoming', detail: 'Dates and registration information will be announced.' };
    }

    const fallbackStatus = String(definition.defaultStatus || '').toLowerCase();
    if (fallbackStatus === 'postponed') {
        return { key: 'postponed', label: 'Postponed', detail: 'The season is postponed.' };
    }
    if (fallbackStatus === 'past') {
        return { key: 'past', label: 'Past', detail: 'This season has finished.' };
    }
    if (fallbackStatus === 'active') {
        return { key: 'active', label: 'Active now', detail: 'This League is currently underway.' };
    }
    if (fallbackStatus === 'upcoming') {
        return { key: 'upcoming', label: 'Upcoming', detail: 'Dates and registration information will be announced.' };
    }
    return { key: 'scheduled', label: 'Schedule TBC', detail: 'Dates will be announced soon.' };
}

function renderWinterLeaguePage(definition, data, error) {
    return renderSeasonLeaguePage(definition, data, error, {
        theme: 'winter',
        icon: 'fa-snowflake fa-icon-winter',
        intro: 'The Winter League opens the seasonal competition cycle. Check the current event status before making plans to compete.',
        detail: 'Winter rounds are played Swiss-style, with every contestant staying in the standings through the final scheduled round.'
    });
}

function renderSpringLeaguePage(definition, data, error) {
    return renderSeasonLeaguePage(definition, data, error, {
        theme: 'spring',
        icon: 'fa-seedling fa-icon-spring',
        intro: "The Spring League brings contestants back for another season of No Man's Sky Xeno Arena competition.",
        detail: 'Build your record across the full Swiss-style schedule; there is no knockout bracket or playoff stage.'
    });
}

function renderSummerLeaguePage(definition, data, error) {
    return renderSeasonLeaguePage(definition, data, error, {
        theme: 'summer',
        icon: 'fa-sun fa-icon-summer',
        intro: 'The Summer League is the final seasonal League before the Xeno Championship returns in Autumn.',
        detail: 'Follow standings across up to 10 weekly rounds, with results determining the final League table.'
    });
}

function renderSeasonLeaguePage(definition, data, error, content) {
    const status = getLeagueStatus(definition, data);
    const eventInfo = renderLeagueEventInfo(definition, status, content);
    const pageHeader = `
        <div class="league-detail-hero ${content.theme}">
            <div class="league-detail-season"><i class="fas ${content.icon}" aria-hidden="true"></i> ${definition.seasonName} season · ${definition.seasonGroup}</div>
            <span class="league-status-badge ${status.key}">${status.label}</span>
            <h1>${definition.title}</h1>
            <p>${content.intro}</p>
            <button class="btn site-btn league-back-button" type="button" onclick="navigateToPage('leagues')"><i class="fas fa-arrow-left" aria-hidden="true"></i> Back to Leagues</button>
        </div>
    `;
    if (error || !data) {
        return `
            <div class="league-page ${content.theme}">
                ${pageHeader}
                ${eventInfo}
                <div class="card league-unavailable"><p class="para-txt">Live standings and fixtures could not be loaded right now. Please try again later.</p></div>
            </div>
        `;
    }

    const players = Array.isArray(data.players) ? data.players : [];
    const fixtures = Array.isArray(data.fixtures) ? data.fixtures : [];
    const completedFixtures = fixtures.filter(fixture => fixture.status === 'completed');
    const completedFixturesSourceId = `completed-fixtures-${definition.pageId}`;
    const completedFixturesTrigger = completedFixtures.length ? `
        <button class="completed-fixtures-trigger" type="button"
            data-open-completed-fixtures
            data-completed-fixtures-source="${completedFixturesSourceId}"
            data-completed-fixtures-title="${definition.title} - Completed Fixtures">
            <i class="fas fa-flag-checkered" aria-hidden="true"></i>
            <span>Completed fixtures</span>
            <span class="completed-fixtures-count">${completedFixtures.length}</span>
        </button>
    ` : '';
    const completedFixturesSource = `
        <div id="${completedFixturesSourceId}" hidden>
            ${renderCompletedFixtures(completedFixtures)}
        </div>
    `;
    const podium = getLeaguePodium(definition, data);
    const hasPodium = podium.some(isRecordedPodiumName);
    const podiumHtml = hasPodium ? `
        <div class="card podium-card">
            <h2 class="para-h1">League Podium</h2>
            <div class="podium-grid">
                <div class="podium-item gold">
                    <span class="medal-badge">1</span>
                    <div>${podium[0] || 'TBC'}</div>
                    <div class="podium-label">League Champion</div>
                </div>
                <div class="podium-item silver">
                    <span class="medal-badge">2</span>
                    <div>${podium[1] || 'TBC'}</div>
                    <div class="podium-label">Runner-up</div>
                </div>
                <div class="podium-item bronze">
                    <span class="medal-badge">3</span>
                    <div>${podium[2] || 'TBC'}</div>
                    <div class="podium-label">Third Place</div>
                </div>
            </div>
        </div>
    ` : '';
    const cardIdPrefix = `player-card-${definition.pageId}`;
    const leagueInfoHtml = renderLeagueInfoCards(definition, data.metadata);

    return `
        <div class="league-page ${content.theme}">
            ${pageHeader}
            ${eventInfo}
            ${leagueInfoHtml}
            <div class="card">
                <h2 class="para-h1">Current Standings</h2>
                ${renderPlayerStandings(players, 0, cardIdPrefix)}
            </div>
            <div class="card">
                <div class="fixtures-section-header">
                    <h2 class="para-h1">Upcoming Fixtures</h2>
                    ${completedFixturesTrigger}
                </div>
                ${renderUpcomingFixtures({ fixtures }, players.length || 32, { league: true })}
            </div>
            ${completedFixturesSource}
            ${podiumHtml}
            <div class="card">
                <button class="btn site-btn" type="button" onclick="populateLeagueRulesPage()"><i class="fas fa-book"></i> View League Rules</button>
            </div>
        </div>
    `;
}

function renderLeagueEventInfo(definition, status, content) {
    return `
        <div class="card league-detail-info">
            <h2 class="para-h1">About the ${definition.seasonName} League</h2>
            <p class="para-txt">${definition.description}</p>
            <p class="para-txt">${content.detail}</p>
            <div class="league-detail-facts">
                <span><i class="fas fa-users" aria-hidden="true"></i> No fixed player limit</span>
                <span><i class="fas fa-arrows-rotate" aria-hidden="true"></i> Swiss format throughout</span>
                <span><i class="fas fa-calendar-week" aria-hidden="true"></i> Up to 10 weekly rounds</span>
                <span><i class="fas fa-ban" aria-hidden="true"></i> No elimination stage</span>
            </div>
            <p class="league-detail-status"><strong>Status:</strong> <span class="league-status-badge ${status.key}">${status.label}</span> ${status.detail}</p>
            <button class="btn site-btn" type="button" onclick="populateLeagueRulesPage()"><i class="fas fa-book"></i> Read League Rules</button>
        </div>
    `;
}

function renderLeagueInfoCards(definition, metadata) {
    const registration = metadata?.registration || {};
    const registrationUrl = getSafeExternalUrl(registration.registrationLink);
    const registrationHtml = `
        <div class="card registration-card">
            <h2 class="para-h1">League Registration</h2>
            <p class="para-txt">${registrationUrl ? 'Use the link below to register for this league.' : 'Registration details will be announced here when available.'}</p>
            ${registrationUrl ? `<a href="${registrationUrl}" class="btn registration-btn" target="_blank" rel="noopener">Register Now</a>` : ''}
        </div>
    `;

    const donation = registration.donation || {};
    const charity = {
        cause: donation.cause || leaguesCharity.cause || '',
        link: donation.link || leaguesCharity.link || '#'
    };
    const donationUrl = getSafeExternalUrl(charity.link);
    const donationHtml = donationUrl ? `
        <div class="card registration-card donation-card league-donation-card">
            <h2 class="para-h1">Charitable Donation</h2>
            <p class="para-txt">Support ${charity.cause}.</p>
            ${definition.charity?.goal > 0 ? renderDonationProgress({ charity: definition.charity }) : ''}
            <a href="${donationUrl}" class="btn donation-btn" target="_blank" rel="noopener">Donate to ${charity.cause}</a>
        </div>
    ` : '';

    return `<div class="card-row ${donationHtml ? 'two-cards' : 'one-card'}">${registrationHtml}${donationHtml}</div>`;
}

function getSafeExternalUrl(value) {
    if (!value) {
        return '';
    }

    try {
        const url = new URL(value, window.location.href);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (error) {
        return '';
    }
}

function renderPodium(top3) {
    return `
        <div class="podium-grid">
            <div class="podium-item gold">
                <span class="medal-badge">1</span>
                <div class="para-txt">${top3[0]}</div>
                <div class="podium-label">Xeno Champion</div>
            </div>
            <div class="podium-item silver">
                <span class="medal-badge">2</span>
                <div class="para-txt">${top3[1]}</div>
                <div class="podium-label">Silver Medallist</div>
            </div>
            <div class="podium-item bronze">
                <span class="medal-badge">3</span>
                <div class="para-txt">${top3[2]}</div>
                <div class="podium-label">Bronze Medallist</div>
            </div>
        </div>
    `;
}

function renderRegistrationCard(record, metadata) {
    if (!record || !record.dates) return '';

    const range = parseTournamentDateRange(record.dates);
    if (!range) return '';

    const now = new Date();
    const tournamentStart = range.start;
    const tournamentEnd = range.end;

    const monthBefore = new Date(tournamentStart.getFullYear(), tournamentStart.getMonth() - 1, 1);
    
    const registrationClose = new Date(tournamentStart);

    let statusText = '';
    let buttonHtml = '';
    let extraLine = '';
    const registrationLink = metadata?.registration?.registrationLink || '#';

    if (now < monthBefore) {
        statusText = 'Registration for this tournament is not open yet. Check back soon for more information.';
        extraLine = `<p class="para-txt"><strong>Registration Opens:</strong> ${monthBefore.toLocaleDateString('en-GB')}</p>`;
    } else if (now >= monthBefore && now < registrationClose) {
        statusText = 'Registration is now open. Secure your place in the current tournament before slots fill up.';
        buttonHtml = `<a href="${registrationLink}" class="btn registration-btn" target="_blank" rel="noopener">Register Now</a>`;
    } else if (now >= registrationClose && now < tournamentStart) {
        statusText = 'Registration is now closed. The tournament will begin soon!';
    } else {
        return '';
    }

    return `
        <div class="card registration-card">
            <h2 class="para-h1">Contestant Registration</h2>
            <p class="para-txt">${statusText}</p>
            ${extraLine}
            ${buttonHtml}
        </div>
    `;
}

function renderDonationCard(record, metadata, overlay = false) {
    if (!record || !record.dates) return '';

    const range = parseTournamentDateRange(record.dates);
    if (!range) return '';

    const now = new Date();
    const tournamentStart = range.start;
    const tournamentEnd = range.end;

    const monthBefore = new Date(tournamentStart.getFullYear(), tournamentStart.getMonth() - 1, 1);
    const charity = getCharityInfo(record, metadata);

    const donationLabel = now >= monthBefore && now <= tournamentEnd
        ? `Donate to ${charity.cause}`
        : `Support ${charity.cause}`;

    const donationMessage = now >= monthBefore && now <= tournamentEnd
        ? `This year the Xeno Championship is proud to be supporting ${charity.cause}. Help us make a difference by contributing to this worthy cause. Every donation counts and goes directly to supporting ${charity.cause}'s mission.`
        : `Xeno Championship is proud to be supporting ${charity.cause}. Help us make a difference by contributing to this worthy cause. Visit their website to learn how you can support ${charity.cause}.`;

    const donationButton = `<a href="${charity.link}" class="btn donation-btn" target="_blank" rel="noopener">${donationLabel}</a>`;
    const progressHtml = renderDonationProgress(record);

    return `
        <div class="card registration-card donation-card${overlay ? ' current-donation-overlay' : ''}">
            <h2 class="para-h1">Charitable Donation</h2>
            <p class="para-txt">${donationMessage}</p>
            ${progressHtml}
            ${donationButton}
        </div>
    `;
}

function getCharityInfo(record, metadata) {
    const donation = metadata?.registration?.donation || {};
    return {
        cause: donation.cause || defaultCharity.cause || '',
        link: donation.link || defaultCharity.link || '#',
        current: record?.charity?.current ?? null,
        goal: record?.charity?.goal ?? null
    };
}

function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '£0.00';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

function renderDonationProgress(record) {
    const charity = record?.charity;
    if (!charity || charity.current == null || charity.goal == null) return '';

    const current = charity.current;
    const goal = charity.goal;
    const percent = goal > 0 ? Math.min(100, (current / goal) * 100) : 100;
    const exceeded = goal > 0 && current >= goal;
    const label = record.past ? 'Final total raised' : 'Raised';
    const statusText = exceeded
        ? `Goal exceeded! ${label} ${formatCurrency(current)} on a ${formatCurrency(goal)} target.`
        : `${label} ${formatCurrency(current)} of ${formatCurrency(goal)} target.`;

    return `
        <div class="donation-progress">
            <div class="donation-progress-label">${statusText}</div>
            <div class="donation-progress-track">
                <div class="donation-progress-fill ${exceeded ? 'goal-exceeded' : ''}" style="width: ${percent}%;"></div>
            </div>
        </div>
    `;
}

function renderHomeDonationSection(record, metadata) {
    const charity = getCharityInfo(record, metadata);
    if (!charity.cause || !record.charity?.showOnHome) return `
        <div class="card home-card-single">
            <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary-color);">
                <i class="fas fa-gamepad"></i>
            </div>
            <h2 class="para-h1">Competitive Gameplay</h2>
            <p class="para-txt" style="margin-bottom: 1rem;">Participating in the Xeno Championship is a fun and competitive endeavour, allowing all to battle it out against the best of the best in Xeno Arena showdowns.</p>
            <p class="para-txt">While the tournament itself is highly competitive, it is all run in support of <a href="https://www.cancerresearchuk.org" target="_blank" rel="noopener" class="contact-email">Cancer Research UK</a>, with a fair play and goodwill focus kept in mind.</p>
        </div>
    `;

    const progressHtml = renderDonationProgress(record);
    return `
        <div class="card">
            <h2 class="para-h1">Current Donation Target</h2>
            <p class="para-txt">Help us support ${charity.cause} during the ${record.title} tournament.</p>
            ${progressHtml}
            <a href="${charity.link}" class="btn donation-btn" target="_blank" rel="noopener">Donate to ${charity.cause}</a>
        </div>
    `;
}

function renderHomeLeagueDonationSection() {
    const leagueRecord = leagueRecords.find(record => record.current_season);
    if (!leagueRecord?.charity?.showOnHome) {
        return '';
    }

    const cause = leaguesCharity.cause || '';
    const donationUrl = getSafeExternalUrl(leaguesCharity.link);
    if (!cause || !donationUrl) {
        return '';
    }

    return `
        <div class="card donation-card league-donation-card home-league-donation-card">
            <h2 class="para-h1">Current League Season Donation Target</h2>
            <p class="para-txt">Help us support ${cause} throughout the ${leagueRecord.league} League season.</p>
            ${renderDonationProgress(leagueRecord)}
            <a href="${donationUrl}" class="btn donation-btn" target="_blank" rel="noopener noreferrer">Donate to ${cause}</a>
        </div>
    `;
}

function parseTournamentDateRange(rangeText) {
    if (!rangeText) return null;

    const parts = rangeText.split(' - ').map(part => part.trim());
    if (parts.length !== 2) return null;

    const start = parseDateDMY(parts[0]);
    const end = parseDateDMY(parts[1]);
    if (!start || !end) return null;

    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function parseDateDMY(dateText) {
    const [day, month, year] = dateText.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
}

function getRecordYear(record) {
    const match = record.title.match(/(\d{4})/);
    return match ? Number(match[1]) : 0;
}

function renderAllPastRecords(records) {
    return records.map(record => `
        <div class="card">
            <h2 class="para-h1">${record.title}</h2>
            ${renderPodium(record.top3)}
            ${renderDonationProgress(record)}
        </div>
    `).join('');
}

function renderUpcomingFixtures(fixturesData, playerCount = 32, options = {}) {
    if (!fixturesData || !fixturesData.fixtures || fixturesData.fixtures.length === 0) {
        return '<p class="para-txt">No upcoming fixtures scheduled yet.</p>';
    }

    const isLeague = options.league === true;
    const fixtures = fixturesData.fixtures.filter(fixture => fixture.status !== 'completed');
    const qualifiers = fixtures
        .filter(fixture => isLeague || fixture.fixtureId === 'Qualifier')
        .sort((a, b) => {
            if (isLeague) {
                const roundDifference = Number(a.round ?? Number.POSITIVE_INFINITY) - Number(b.round ?? Number.POSITIVE_INFINITY);
                if (Number.isFinite(roundDifference) && roundDifference !== 0) return roundDifference;
            }
            const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`).getTime() : Number.POSITIVE_INFINITY;
            const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`).getTime() : Number.POSITIVE_INFINITY;
            return (Number.isNaN(dateA) ? Number.POSITIVE_INFINITY : dateA) - (Number.isNaN(dateB) ? Number.POSITIVE_INFINITY : dateB);
        });
    const advancingCount = playerCount <= 8 ? 4 : 8;
    const openingRound = advancingCount === 4 ? 'Semi-Final' : 'Quarter-Final';
    const knockoutRoundOrder = [openingRound, `${openingRound}s`, 'Third Place Match', 'Grand Final'];
    const knockoutRounds = (isLeague ? [] : knockoutRoundOrder)
        .filter((round, index, rounds) => rounds.indexOf(round) === index)
        .map(round => ({
            name: round,
            fixtures: fixtures.filter(fixture => fixture.fixtureId === round)
        }))
        .filter(round => round.fixtures.length > 0);

    const qualifierHtml = qualifiers.length > 0
        ? `<div class="fixture-stage fixture-stage-qualification">
            <div class="fixture-stage-heading">
                <span class="fixture-stage-kicker">${isLeague ? 'League Stage' : 'First Stage'}</span>
                <h3>${isLeague ? 'Swiss-Style League' : 'Swiss-Style Qualification'}</h3>
                <p>${isLeague
                    ? 'Up to 10 weekly rounds, with final standings determined by league results and no playoff stage.'
                    : `Five rounds, with the top ${advancingCount} advancing to the championship bracket.`}</p>
            </div>
            <div class="fixtures-list">
                ${qualifiers.map(renderFixtureCard).join('')}
            </div>
        </div>`
        : '';

    const bracketHtml = knockoutRounds.length > 0
        ? `<div class="fixture-stage fixture-stage-knockout">
            <div class="fixture-stage-heading">
                <span class="fixture-stage-kicker">Final Stage</span>
                <h3>Championship Bracket</h3>
                <p>Single elimination from the ${advancingCount === 4 ? 'Semi-Finals' : 'Quarter-Finals'} to the Grand Final.</p>
            </div>
            <div class="fixture-bracket" aria-label="Championship bracket">
                ${knockoutRounds.map(round => `<section class="fixture-bracket-round">
                    <h4>${round.name}</h4>
                    <div class="fixture-bracket-matches">${round.fixtures.map(renderFixtureCard).join('')}</div>
                </section>`).join('')}
            </div>
        </div>`
        : '';

    if (!qualifierHtml && !bracketHtml) {
        return '<p class="para-txt">No upcoming fixtures scheduled yet.</p>';
    }

    return `
        <div class="fixtures-by-stage">
            ${qualifierHtml}
            ${bracketHtml}
        </div>
    `;
}

function renderCompletedFixtures(fixtures) {
    if (!fixtures.length) {
        return '<p class="para-txt">No completed fixtures yet.</p>';
    }

    const sortedFixtures = fixtures.slice().sort((a, b) => {
        const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`).getTime() : Number.NEGATIVE_INFINITY;
        const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`).getTime() : Number.NEGATIVE_INFINITY;
        const timeA = Number.isNaN(dateA) ? Number.NEGATIVE_INFINITY : dateA;
        const timeB = Number.isNaN(dateB) ? Number.NEGATIVE_INFINITY : dateB;
        return timeB - timeA;
    });

    return `<div class="fixtures-list completed-fixtures-list">${sortedFixtures.map(renderFixtureCard).join('')}</div>`;
}

function renderFixtureCard(fixture) {
    const parsedDate = fixture.date ? new Date(`${fixture.date}T${fixture.time || '00:00'}`) : null;
    const fixtureDate = parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
        : 'TBC';
    const statusKey = ['planning', 'scheduled', 'live', 'completed'].includes(fixture.status) ? fixture.status : 'planning';
    const statusLabel = statusKey === 'live' ? 'LIVE' : statusKey === 'completed' ? 'Completed' : statusKey === 'scheduled' ? 'Scheduled' : 'Planning';
    let streamLinkHtml = '';
    if (['scheduled', 'live'].includes(statusKey) && fixture.streamLink) {
        try {
            const streamUrl = new URL(fixture.streamLink, window.location.href);
            if (streamUrl.protocol === 'http:' || streamUrl.protocol === 'https:') {
                streamLinkHtml = `<a class="fixture-stream-link" href="${streamUrl.href}" target="_blank" rel="noopener noreferrer"><i class="fas fa-play" aria-hidden="true"></i> Watch Live</a>`;
            }
        } catch (error) {
            streamLinkHtml = '';
        }
    }
    const fixtureRound = fixture.fixtureId === 'Qualifier' && fixture.round != null ? ` · Round ${fixture.round}` : '';
    const fixtureTimeZone = fixture.timeZone || fixture.timezone || 'UTC+01:00';
    let fixtureTime = fixture.time || 'TBC';
    if (fixture.time !== "") {
        fixtureTime = `${fixtureTime} (${fixtureTimeZone})`;
    }


    return `
        <article class="fixture-card fixture-card-${statusKey}">
            <div class="fixture-card-header">
                <span class="fixture-card-stage">${fixture.fixtureId || 'Fixture'}${fixtureRound}</span>
                <div class="fixture-card-header-actions">
                    ${streamLinkHtml}
                    <span class="fixture-status ${statusKey}">${statusLabel}</span>
                </div>
            </div>
            <div class="fixture-matchup">
                <div class="fixture-player">
                    <span class="player-name${fixture.winner && fixture.winner === fixture.player1 ? ' winner' : ''}">${fixture.player1 || 'TBC'}</span>
                    <span class="player-platform">${fixture.platform1 || 'Platform TBC'}</span>
                </div>
                <div class="fixture-versus">
                    <span class="vs-text">VS</span>
                    <span class="fixture-format">Best of 3</span>
                </div>
                <div class="fixture-player">
                    <span class="player-name${fixture.winner && fixture.winner === fixture.player2 ? ' winner' : ''}">${fixture.player2 || 'TBC'}</span>
                    <span class="player-platform">${fixture.platform2 || 'Platform TBC'}</span>
                </div>
            </div>
            <div class="fixture-card-footer">
                <span><i class="fas fa-calendar"></i> ${fixtureDate}</span>
                <span><i class="fas fa-clock"></i> ${fixtureTime}</span>
                <span><i class="fas fa-user-tie"></i> ${fixture.umpire || 'Umpire TBC'}</span>
            </div>
        </article>
    `;
}

async function showPastResults(record) {
    const resultsDiv = document.getElementById('past-results');
    resultsDiv.innerHTML = `
        <div class="card">
            <h2 class="para-h1">${record.title} Results</h2>
            ${record.resultsJson ? `
                <p class="para-txt">Loading data...</p>
            ` : `
                <p class="para-txt">No detailed results available for this championship.</p>
                ${renderPodium(record.top3)}
            `}
        </div>
    `;

    if (record.resultsJson) {
        try {
            const response = await fetch(record.resultsJson, { cache: 'no-store' });
            const data = await response.json();
            resultsDiv.innerHTML = `
                <div class="card">
                    <h2>${record.title} Results</h2>
                    ${renderPodium(record.top3)}
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Platform</th>
                                <th>Played</th>
                                <th>Wins</th>
                                <th>Losses</th>
                                <th>OMW%</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.players.map(player => `
                                <tr>
                                    <td>${player.name}</td>
                                    <td>${player.platform}</td>
                                    <td>${player.results.played}</td>
                                    <td>${player.results.wins}</td>
                                    <td>${player.results.losses}</td>
                                    <td>${player.results.omw ?? '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error loading past results:', error);
            resultsDiv.innerHTML = `
                <div class="card">
                    <h2>${record.title} Results</h2>
                    <p>Error loading data. Showing top 3 only.</p>
                    ${renderPodium(record.top3)}
                </div>
            `;
        }
    }
}
