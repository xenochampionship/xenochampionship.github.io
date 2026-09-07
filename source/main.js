const pageNames = {
    'home': 'Home',
    'about': 'About',
    'rules': 'Championship Rules',
    'hof': 'Hall of Fame',
    'results': 'Past Results',
    'current': null,
    'contact': 'Contact',
    'disclaimer': 'Disclaimer',
    'thank-you': 'Thank You',
    'umpires': 'Become an Umpire',
    'umpire-thank-you': 'Thank You'
};

function toggleRuleAccordion(button) {
    const card = button.closest('.accordion-rule-card');
    if (card) {
        card.classList.toggle('expanded');
    }
}

document.addEventListener('DOMContentLoaded', function() {
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
    trackPageView(initialHash); // Track initial load

    populateAboutPage();
    populateRulesPage();
    populateUmpiresPage();
    loadCurrentChampionship();
    populateHallOfFame();
    setupPastResultsSelector();
    populateCurrentChampionship();
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
        updatePageTitle(pageId);
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
        const response = await fetch(currentRecord.resultsJson);
        const data = await response.json();
        populateHomePage(data, currentRecord);
    } catch (error) {
        console.error('Error loading current championship data:', error);
        populateHomePage(null, currentRecord);
    }
}

function populateAboutPage() {
    const aboutPage = document.getElementById('page-about');
    aboutPage.innerHTML = `
        <h1>About the Xeno Championship</h1>
        <div class="card hero-card">
            <img src="https://www.nomanssky.com/media/wzgpapjc/battleshots20.jpg" alt="Xeno Championship Image" class="home-hero-image-secondary">
        </div>
        <div class="card about-hero">
            <div class="about-content">
                <h2 class="para-h1"><i class="fas fa-crown" style="margin-right: 0.5rem;"></i> Welcome to the NMS Xeno Championship</h2>
                <p class="para-txt" style="margin-bottom: 1rem;">The NMS Xeno Championship is an annual community-run tournament celebrating the competitive spirit of No Man's Sky players. The championship aims to bring together players from across the globe to battle it out in thrilling Xeno Arena matches.</p>
                <p class="para-txt">Compete in intense 1v1 best-of-3 fixtures, showcase your companion's skills, and climb the rankings to attain a place in the prestigious Hall of Fame!</p>
            </div>
        </div>
        <div class="card">
            <h2 class="para-h1"><i class="fas fa-ribbon" style="margin-right: 0.5rem;"></i> Charitable Event</h2>
            <p class="para-txt" style="margin-bottom: 1rem;">The Xeno Championship is proud to raising money in aid of <a href="https://www.cancerresearchuk.org" class="contact-email">Cancer Research UK</a> in a concerted effort to combat cancer and support those most deeply affected by it.</p>
            <p class="para-txt" style="margin-bottom: 1rem;">Due to the tournament being free to enter, and each fixture being live streamed, it is highly encouraged that spectators and ontestants donate what they can. This is not a requirement, however the entire goal is to make a positive impact and a real difference in the fight against cancer.</p>
            <p class="para-txt" style="margin-bottom: 1rem;">Charitable donations are made and received via a dedicated Cancer Research UK Giving Page, with the specific donation link for the associated tournament becoming available once contestant registration window opens. At the conclusion of the tournament all proceeds will be donated to Cancer Research UK.</p>
        </div>
        <div class="card">
            <h2 class="para-h1"><i class="fas fa-circle-info" style="margin-right: 0.5rem;"></i> What is Xeno Arena?</h2>
            <p class="para-txt" style="margin-bottom: 1rem;">Xeno Arena is No Man's Sky's competitive multiplayer companion battling mode where interlopers engage in fast-paced creature battles. Using their own companions equipped with various attacks and abilities, players must outmaneuver and out-skill their opponents in a fun and competitive battle to claim the tournament's coveted title of <b>Xeno Champion</b>.</p>
            <p class="para-txt">The championship focuses on fair, skill-based competition while maintaining the creative freedom that makes No Man's Sky special.</p>
        </div>
        <div class="card">
            <h2 class="para-h1"><i class="fas fa-users" style="margin-right: 0.5rem;"></i> Community Driven</h2>
            <p class="para-txt" style="margin-bottom: 1rem;">This tournament is entirely community-run and fan-driven. From the organizers to the participants, everyone contributes to making the Xeno Championship a memorable annual event for the No Man's Sky community.</p>
            <p class="para-txt">Join us in celebrating the game's competitive potential and connecting with fellow interlopers!</p>
        </div>
    `;
}

function populateRulesPage() {
    const rulesPage = document.getElementById('page-rules');
    rulesPage.innerHTML = `
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
                <p class="para-txt" style="margin-bottom: 1rem;">The Xeno Championship features up to <b>32 contestants</b>, competing across two stanges for the title of <b>Xeno Champion</b>. The tournament is designed to reward consistent performance across multiple rounds, culminating in a high-stakes elimination Finals.</p>
                <h3 style="margin-bottom: 0.5rem;">Qualification Stage (Swiss Format)</h3>
                <p class="para-txt">All registered contestants begin in the Qualification stage, which follows a <b>Swiss-style format</b> over the course of <b>5 rounds</b>.</p>
                <ul>
                    <li>In each round, players are paired against opponents with similar records</li>
                    <li>Contestants accumulate wins and losses across all rounds</li>
                    <li>At the conclusion of Round 5, players are ranked based on their overall performance</li>
                </ul>
                <p class="para-txt" style="margin-bottom: 1rem;">The <b>top 8 ranked contestants</b> advance to the Finals stage.</p>
                <p class="para-txt">In the event of tied records, final Qualification standings are determined using <b>Opponent Match Win Percentage (OMW%)</b>, as outlined in the Scoring System section.</p>
                <h3 style="margin-bottom: 0.5rem;">Finals Stage (Single Elimination)</h3>
                <p class="para-txt">The top 8 contestants from the Qualification stage progress to the Finals, which follow a <b>single-elimination knockout format</b>.</p>
                <ul>
                    <li>Quarter-finals determine the four semi-finalists</li>
                    <li>Semi-finals determine the finalists and third-place contenders</li>
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
                <p class="para-txt">Live streaming is strongly encouraged, and <b>required in the case of Finals fixtures</b>.</p>
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
                <p class="para-txt" style="margin-bottom: 1rem;">Once submitted, a contestant’s declared Companion roster becomes locked for the duration of the Fixture. Contestants may freely switch between their declared Companions throughout individual Matches, as permitted by the standard Xeno Arena mechanics, however undeclared Companions may not be used under any circumstances.</p>
                <p class="para-txt">The declared Companion order is also locked upon submission. As per standard Xeno Arena functionality, the first listed Companion will automatically be summoned at the beginning of each Match.</p>
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
                    <li>The <b>top 8 ranked contestants</b> advance to the Finals</li>
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
                    <li>Higher-seeded contestants are matched against lower-seeded contestants in the Quarter-finals</li>
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
                    <li>For <b>Round 1</b>, all foxtures must be scheduled <b>before the tournament begins</b>. Failure to do so may result in forfeiture of a contestant's place in the tournament.</li>
                    <li>For subsequent rounds, a <b>2-day scheduling period</b> is provided between rounds to allow players to arrange their next fixture.</li>
                </ul>
                <p class="para-txt" style="margin-bottom: 1rem;">While an assigned Umpire will assist in facilitating scheduling via Discord, <b>the responsibility ultimately lies with both contestants</b> to communicate promptly and confirm a suitable date and time within the given timeframe.</p>
                <p class="para-txt" style="margin-bottom: 1rem;">Failure to schedule or complete a fixture within the allotted window may result in a forfeit, and recorded as a <b>Fixture No Show</b>.</p>
                <h3 style="margin-bottom: 0.5rem;">Finals Scheduling</h3>
                <p class="para-txt">The Finals stage follows a <b>fixed schedule</b> and takes place across two days:</p>
                <ul>
                    <li><b>30th ${tournamentMonth}</b> - Quarter-finals (Top 8)</li>
                    <li><b>31st ${tournamentMonth}</b> - Semi-finals, Third Place Match, and Grand Final</li>
                </ul>
                <p class="para-txt" style="margin-bottom: 1rem;">Due to broadcast and production requirements, all Finals fixtures must be played at their assigned times and are expected to be <b>live streamed on Twitch</b>.</p>
                <p class="para-txt">Each day will follow a structured schedule:</p>
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
                    <li>Be fully available on <b>30th and 31st ${tournamentMonth}</b> if the qualify for Finals</li>
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
                <p class="para-txt" style="margin-bottom: 1rem;">Participartion in the Xeno Championship is limited to <b>32 contestants</b>, with places being allocated on a <b>first come, first serve</b> basis.</p>
                <p class="para-txt">There is <b>no registration fee</b> required to enter.</p>
                <h3 style="margin-bottom: 0.5rem;">Registration Window</h3>
                <p class="para-txt" style="margin-bottom: 1rem;">Registration will open automatically on <b>1st July</b> and will close <b>4 days prior to the start of the tournament</b>.</p>
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
                    <li><b>30th ${tournamentMonth}</b> for Quarter-finals</li>
                    <li><b>31st ${tournamentMonth}</b> for Semi-finals, Third Place Match, and Grand Final</li>
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
                <a class="btn site-btn" href="https://discord.gg/mS25zRggz2" target="_blank" rel="noopener">Join Discord</a>
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
                <p style="font-size: 1.3rem; max-width: 600px; margin-bottom: 2rem; text-shadow: 0 0 15px rgba(0, 0, 0, 0.8); line-height: 1.6;">The Xeno Championship blends fan-fueled passion with community-run organized competition. Interlopers face off in 1v1 Xeno Arena fixtures across Swiss-style Qualification rounds and a top-8 elimination Finals bracket. Every battle is important and all in aid of Cancer Research UK.</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <button class="btn site-btn" style="flex: 1;" onclick="navigateToPage('about')"><i class="fas fa-info-circle"></i> Find Out More</button>
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
                <a class="btn site-btn" href="https://discord.gg/mS25zRggz2" target="_blank" rel="noopener">Discord Server</a>
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
    
    const tournamentName = data?.metadata?.tournamentName || currentRecord.title;

    const standingsHtml = (!data || !data.players || data.players.length === 0) 
        ? '<div class="card" style="margin-bottom: 0px;"><p class="para-txt">No players registered yet.</p></div>'
        : (() => {
            const hasScores = data.players.some(p => p.results.wins > 0 || p.results.played > 0);
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
                                    <span class="wins">${player.results.wins} Wins</span>
                                    <span class="omw">OMW ${player.results.omw ?? '—'}%</span>
                                </span>
                            </button>
                            <div class="player-details">
                                <div class="detail-row"><span>Played</span><span>${player.results.played}</span></div>
                                <div class="detail-row"><span>Wins</span><span>${player.results.wins}</span></div>
                                <div class="detail-row"><span>Losses</span><span>${player.results.losses}</span></div>
                                ${player.results.omw !== undefined ? `<div class="detail-row"><span>OMW%</span><span>${player.results.omw}%</span></div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        })();

    currentChampionshipPage.innerHTML = `
        <h1 style="margin-bottom: 0;">${tournamentName}</h1>
        <p class="para-txt" style="margin-top: 0; margin-bottom: 1rem; font-style: italic;">${currentRecord.dates}</p>
        <div class="card hero-card">
            <img src="https://www.nomanssky.com/media/eegigxne/spectators03.jpg" alt="Xeno Championship Image" class="home-hero-image-secondary">
        </div>
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
            <p class="para-txt"><strong>Schedule:</strong> Round completiong windows in UK time (UTC+01:00)</p>
            <p class="para-txt"><strong>Streaming:</strong> All Finals matches are streamed, with Qualification highlights throughout ${tournamentMonth}</p>
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
        statusText = 'Registration for this tournament is not open yet. Check back soon for more information.';
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
        <div class="card registration-card donation-card">
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
                                <span><i class="fas fa-gamepad" style="margin-right: 0.25rem;"></i> ${fixture.fixtureId}</span>
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
