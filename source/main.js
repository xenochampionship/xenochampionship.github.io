const SITE_UNDER_CONSTRUCTION = true;

document.addEventListener('DOMContentLoaded', function() {
    initConstructionBanner();
    
    initMobileMenu();

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
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
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
    trackPageView(initialHash); // Track initial load

    loadCurrentChampionship();
    populateHallOfFame();
    setupPastResultsSelector();
    populateCurrentChampionship();
});

function initConstructionBanner() {
    const banner = document.getElementById('construction-banner');
    const closeBtn = document.getElementById('banner-close');
    const header = document.querySelector('header');

    if (!SITE_UNDER_CONSTRUCTION) {
        banner.classList.add('hidden');
        header.classList.add('banner-hidden');
        return;
    }

    header.classList.add('banner-visible');

    closeBtn.addEventListener('click', function() {
        banner.classList.add('hidden');
        header.classList.remove('banner-visible');
        header.classList.add('banner-hidden');
        localStorage.setItem('bannerDismissed', 'true');
    });

    if (localStorage.getItem('bannerDismissed') === 'true') {
        banner.classList.add('hidden');
        header.classList.remove('banner-visible');
        header.classList.add('banner-hidden');
    }
}

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

function navigateToPage(pageId) {
    window.location.hash = '#' + pageId;
    showPage(pageId);
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

async function loadCurrentChampionship() {
    const currentRecord = records.find(r => !r.past);
    if (!currentRecord || !currentRecord.resultsJson) return;

    const currentChampionshipMenuItems = document.querySelectorAll('a[href="#current"]');
    currentChampionshipMenuItems.forEach(item => {
        item.innerHTML = currentRecord.title;
    });

    try {
        const response = await fetch(currentRecord.resultsJson);
        const data = await response.json();
        populateHomePage(data, currentRecord);
    } catch (error) {
        console.error('Error loading current championship data:', error);
        populateHomePage(null, currentRecord);
    }
}

function populateHomePage(data, record) {
    const homePage = document.getElementById('page-home');
    homePage.innerHTML = `
        <div class="card hero-card">
            <img src="https://www.nomanssky.com/media/eohnnwwy/no-mans-sky-xeno-arena-screenshot-3-5mb.jpg" alt="Xeno Championship Image" class="home-hero-image">
        </div>
        <div class="card home-hero">
            <div class="home-content">
                <h2 class="para-h1">Enter the Xeno Arena</h2>
                <p style="margin-bottom: 1rem;" class="para-txt">The Xeno Championship is a structured competitive event built around the Xeno Arena.</p>
                <p style="margin-bottom: 1rem;" class="para-txt">Players face off in scheduled 1v1 fixtures, using strategy, timing, and companion synergy to outplay their opponents.</p>
                <p class="para-txt">Every match is streamed, every result matters, and only the top competitors advance to the final stage.</p>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn site-btn" onclick="navigateToPage('about')"><i class="fas fa-info-circle"></i> How it Works</button>
                    <button class="btn site-btn" onclick="navigateToPage('current')"><i class="fas fa-trophy"></i> View Championship</button>
                </div>
            </div>
            <div class="home-image">
                <i class="fas fa-rocket"></i>
            </div>
        </div>
        <div class="card">
            <h2 class="para-h1">Featured Content</h2>
            <ul class="para-ul" style="margin-bottom: 0px;">
                <li><strong><i class="fas fa-gamepad"></i> Xeno Arena Basics:</strong> Learn the fundamentals of competitive play</li>
                <li><strong><i class="fas fa-video"></i> Live Streams:</strong> Watch ongoing matches and tournaments</li>
                <li><strong><i class="fas fa-crown"></i> Hall of Fame:</strong> Celebrate past champions and their achievements</li>
                <li><strong><i class="fas fa-users"></i> Community:</strong> Connect with fellow explorers and players</li>
            </ul>
        </div>
        <div class="card">
            <h2 class="para-h1">Quick Links</h2>
            <p class="para-txt">Ready to dive in? Check out these popular sections:</p>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                <button class="btn site-btn" onclick="navigateToPage('rules')"><i class="fas fa-book"></i> Tournament Rules</button>
                <button class="btn site-btn" onclick="navigateToPage('hof')"><i class="fas fa-trophy"></i> Hall of Fame</button>
                <button class="btn site-btn" onclick="navigateToPage('results')"><i class="fas fa-history"></i> Past Results</button>
                <button class="btn site-btn" onclick="navigateToPage('contact')"><i class="fas fa-envelope"></i> Get Involved</button>
            </div>
        </div>
    `;
}

function populateHallOfFame() {
    const hofPage = document.getElementById('page-hof');
    const pastRecords = records.filter(r => r.past).slice().sort((a, b) => getRecordYear(b) - getRecordYear(a));

    const hofContent = pastRecords.length > 0
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
        : `<div class="card" style="text-align: center; padding: 2rem;">
            <i class="fas fa-trophy" style="font-size: 4rem; color: rgba(255, 215, 0, 1); margin-bottom: 1rem;"></i>
            <h2 class="para-h1" style="margin-bottom: 1rem;">Champions Will Be Immortalized Here</h2>
            <p class="para-txt">The Hall of Fame will showcase the champions of each Xeno Championship tournament.<br><br>Check back after the completion of future tournaments to see the winners celebrated here.</p>
        </div>`;

    hofPage.innerHTML = `
        <h1>Hall of Fame</h1>
        <p class="hof-subtitle para-txt">Only the champions make it here. Every year a single player wins the right to be immortalized in the Xeno Championship Hall of Fame.</p>
        ${hofContent}
    `;
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
                <p class="para-txt">Detailed results from completed Xeno Championship tournaments will be available here.<br><br>Check back after the completion of future tournaments to view standings, match results, and tournament statistics.</p>
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
        const pointsA = Number(a.results.points ?? 0);
        const pointsB = Number(b.results.points ?? 0);
        if (pointsB !== pointsA) return pointsB - pointsA;

        const omwA = Number(a.results.omw ?? 0);
        const omwB = Number(b.results.omw ?? 0);
        if (omwB !== omwA) return omwB - omwA;

        const winsA = Number(a.results.wins ?? 0);
        const winsB = Number(b.results.wins ?? 0);
        if (winsB !== winsA) return winsB - winsA;

        return a.name.localeCompare(b.name);
    });
}

function togglePlayerDetails(index) {
    const card = document.getElementById(`player-card-${index}`);
    if (!card) return;
    card.classList.toggle('expanded');
    const summary = card.querySelector('.player-summary');
    if (summary) {
        summary.setAttribute('aria-expanded', card.classList.contains('expanded') ? 'true' : 'false');
    }
}

async function populateCurrentChampionship() {
    const currentRecord = records.find(r => !r.past);
    if (!currentRecord) return;

    const currentChampionshipPage = document.getElementById('page-current');

    let data = null;
    if (currentRecord.resultsJson) {
        try {
            const response = await fetch(currentRecord.resultsJson);
            data = await response.json();
        } catch (error) {
            console.error('Error loading Current Championship data:', error);
        }
    }

    let fixturesHtml = '';
    try {
        const fixturesResponse = await fetch(dataHostUrl + 'fixtures.json');
        const fixturesData = await fixturesResponse.json();
        fixturesHtml = renderUpcomingFixtures(fixturesData);
    } catch (error) {
        console.log('No fixtures data available');
        fixturesHtml = '<div class="card" style="margin-bottom: 0px;"><p class="para-txt">No upcoming fixtures scheduled yet.</p></div>';
    }

    const registrationHtml = renderRegistrationCard(currentRecord);
    const donationHtml = renderDonationCard(currentRecord, data?.metadata);
    const registrationSection = (registrationHtml || donationHtml)
        ? `<div class="card-row ${registrationHtml && donationHtml ? 'two-cards' : 'one-card'}">${registrationHtml}${donationHtml}</div>`
        : '';

    const standingsHtml = (!data || !data.players || data.players.length === 0) 
        ? '<div class="card" style="margin-bottom: 0px;"><p class="para-txt">No players registered yet.</p></div>'
        : (() => {
            const hasScores = data.players.some(p => p.results.points > 0 || p.results.played > 0);
            return `
                <div class="standings-accordion">
                    ${sortPlayersByStandings(data.players).map((player, index) => `
                        <div class="player-card" id="player-card-${index}">
                            <button class="player-summary" type="button" onclick="togglePlayerDetails(${index})" aria-expanded="false" style="grid-template-columns: ${hasScores ? 'auto 1fr auto' : '1fr auto'};">
                                ${hasScores ? `<span class="rank-badge">${index + 1}</span>` : ''}
                                <span class="player-title">
                                    <span class="player-name">${player.name}</span>
                                    <span class="player-platform">${player.platform}</span>
                                </span>
                                <span class="player-stats">
                                    <span class="points">${player.results.points} pts</span>
                                    <span class="omw">OMW ${player.results.omw ?? '—'}%</span>
                                </span>
                            </button>
                            <div class="player-details">
                                <div class="detail-row"><span>Played</span><span>${player.results.played}</span></div>
                                <div class="detail-row"><span>Wins</span><span>${player.results.wins}</span></div>
                                <div class="detail-row"><span>Losses</span><span>${player.results.losses}</span></div>
                                <div class="detail-row"><span>Forfeits</span><span>${player.results.forfeits ?? 0}</span></div>
                                ${player.results.omw !== undefined ? `<div class="detail-row"><span>OMW%</span><span>${player.results.omw}%</span></div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        })();

    currentChampionshipPage.innerHTML = `
        <div class="card hero-card">
            <img src="https://www.nomanssky.com/media/eegigxne/spectators03.jpg" alt="Xeno Championship Image" class="home-hero-image-secondary">
        </div>
        <h1 style="margin-bottom: 0;">${currentRecord.title}</h1>
        <p class="para-txt" style="margin-top: 0; margin-bottom: 1rem; font-style: italic;">${currentRecord.dates}</p>
        ${registrationSection}
        <div class="card">
            <h2 class="para-h1">Current Standings</h2>
            ${standingsHtml}
        </div>
        <div class="card">
            <h2 class="para-h1">Upcoming Fixtures</h2>
            ${fixturesHtml}
        </div>
        <div class="card podium-card">
            <h2 class="para-h1">Championship Podium</h2>
            <div class="podium-grid">
                <div class="podium-item gold">
                    <span class="medal-badge">1</span>
                    <div>${currentRecord.top3[0]}</div>
                    <div class="podium-label">Gold</div>
                </div>
                <div class="podium-item silver">
                    <span class="medal-badge">2</span>
                    <div>${currentRecord.top3[1]}</div>
                    <div class="podium-label">Silver</div>
                </div>
                <div class="podium-item bronze">
                    <span class="medal-badge">3</span>
                    <div>${currentRecord.top3[2]}</div>
                    <div class="podium-label">Bronze</div>
                </div>
            </div>
        </div>
        <div class="card">
            <h2 class="para-h1">Tournament Information</h2>
            <p class="para-txt"><strong>Format:</strong> 1v1 Best-of-3 Xeno Arena matches</p>
            <p class="para-txt"><strong>Stages:</strong> Qualification Round → Top 8 Playoffs</p>
            <p class="para-txt"><strong>Schedule:</strong> Weekday fixtures in UK time (UTC+01:00)</p>
            <p class="para-txt"><strong>Streaming:</strong> All matches are streamed and monitored</p>
            <button class="btn site-btn" onclick="navigateToPage('rules')" style="margin-top: 1rem;"><i class="fas fa-book"></i> View Full Rules</button>
        </div>
    `;
}

function renderPodium(top3) {
    return `
        <div class="podium-grid">
            <div class="podium-item gold">
                <span class="medal-badge">1</span>
                <div class="para-txt">${top3[0]}</div>
                <div class="podium-label">Gold</div>
            </div>
            <div class="podium-item silver">
                <span class="medal-badge">2</span>
                <div class="para-txt">${top3[1]}</div>
                <div class="podium-label">Silver</div>
            </div>
            <div class="podium-item bronze">
                <span class="medal-badge">3</span>
                <div class="para-txt">${top3[2]}</div>
                <div class="podium-label">Bronze</div>
            </div>
        </div>
    `;
}

function renderRegistrationCard(record) {
    if (!record || !record.dates) return '';

    const range = parseTournamentDateRange(record.dates);
    if (!range) return '';

    const now = new Date();
    const tournamentStart = range.start;
    const tournamentEnd = range.end;

    const monthBefore = new Date(tournamentStart.getFullYear(), tournamentStart.getMonth() - 1, 1);
    
    const registrationClose = new Date(tournamentStart);
    registrationClose.setDate(registrationClose.getDate() - 4);

    let statusText = '';
    let buttonHtml = '';
    let extraLine = '';

    if (now < monthBefore) {
        statusText = 'Registration is not open yet. Check back soon.';
        extraLine = `<p class="para-txt"><strong>Registration Opens:</strong> ${monthBefore.toLocaleDateString('en-GB')}</p>`;
    } else if (now >= monthBefore && now < registrationClose) {
        statusText = 'Registration is now open. Secure your place in the current tournament before slots fill up.';
        buttonHtml = `<a href="#" class="btn registration-btn" target="_blank" rel="noopener">Register Now</a>`;
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

function renderDonationCard(record, metadata) {
    if (!record || !record.dates) return '';

    const range = parseTournamentDateRange(record.dates);
    if (!range) return '';

    const now = new Date();
    const tournamentStart = range.start;
    const tournamentEnd = range.end;

    const monthBefore = new Date(tournamentStart.getFullYear(), tournamentStart.getMonth() - 1, 1);

    if (now < monthBefore || now > tournamentEnd) return '';

    const donation = metadata?.registration?.donation;
    const donationCause = donation?.cause || '';
    const donationLink = donation?.link || '#';
    const donationLogo = donation?.logo || '#';
    const donationLabel = `Donate to ${donationCause}`;
    const donationMessage = `This year the Xeno Championship is proud to be supporting ${donationCause}. Help us make a difference by contributing to this worthy cause. Every donation counts and goes directly to supporting ${donationCause}'s mission.`;

    return `
        <div class="card registration-card donation-card">
            <h2 class="para-h1">Charitable Donation</h2>
            <p class="para-txt">${donationMessage}<img src="${donationLogo}" class="charity-box-logo" /></p>
            <a href="${donationLink}" class="btn donation-btn" target="_blank" rel="noopener">${donationLabel}</a>
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
        </div>
    `).join('');
}

function renderUpcomingFixtures(fixturesData) {
    if (!fixturesData || !fixturesData.fixtures || fixturesData.fixtures.length === 0) {
        return '<p class="para-txt">No upcoming fixtures scheduled yet.</p>';
    }

    const fixtures = fixturesData.fixtures;
    return `
        <div class="fixtures-list">
            ${fixtures.map(fixture => `
                <div class="fixture-card">
                    <div class="fixture-details">
                        <div class="fixture-datetime">
                            <div class="fixture-dt-box">
                                <span><i class="fas fa-hashtag" style="margin-right: 0.25rem;"></i> ${fixture.fixtureId}</span>
                                <span><i class="fas fa-calendar" style="margin-right: 0.25rem;"></i> ${new Date(fixture.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                <span><i class="fas fa-clock" style="margin-right: 0.25rem;"></i> ${fixture.time}</span>
                            </div>
                        </div>
                        <div class="fixture-matchup">
                            <div class="fixture-player">
                                <span class="player-name">${fixture.player1}</span>
                                <span class="player-platform">${fixture.platform1}</span>
                            </div>
                            <div class="vs-text">VS</div>
                            <div class="fixture-player">
                                <span class="player-name">${fixture.player2}</span>
                                <span class="player-platform">${fixture.platform2}</span>
                            </div>
                        </div>
                        <div class="fixture-umpire">
                            <div class="fixture-ump-box">
                                <i class="fas fa-user-tie"></i> Umpire: ${fixture.umpire}
                            </div>
                        </div>
                    </div>
                    <div class="fixture-status ${fixture.status}">
                        ${fixture.status === 'scheduled' ? 'Scheduled' : fixture.status === 'live' ? 'LIVE' : 'Completed'}
                    </div>
                </div>
            `).join('')}
        </div>
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
            const response = await fetch(record.resultsJson);
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
                                <th>Points</th>
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
                                    <td>${player.results.points}</td>
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
