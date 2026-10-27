const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 2600); };

const pageNames = { overview: 'Home', diagnostic: 'Test & Practice', galaxy: 'Knowledge galaxy', tutor: 'AI Interaction', syllabus: 'Syllabus & Summary', support: 'Customer Care', progress: 'My progress' };
function goToPage(name) {
  if (!pageNames[name]) return;
  $$('.page').forEach(p => p.classList.toggle('active-page', p.id === `page-${name}`));
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === name));
  $('#breadcrumbCurrent').textContent = pageNames[name];
  $('#sidebar').classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});
}
$$('.nav-item').forEach(button => button.addEventListener('click', () => goToPage(button.dataset.page)));
$$('[data-go]').forEach(button => button.addEventListener('click', () => goToPage(button.dataset.go)));
$('#menuButton').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#notifications').addEventListener('click', () => toast('You’re all caught up! Keep learning ✦'));
$('#profileButton').addEventListener('click', () => toast('Profile settings are a demo feature.'));

// Performance chart is interactive: changing the range updates the plotted values.
const chartSets = {
  week: {purple:[160,135,145,95,110,55,65], cyan:[175,160,170,130,145,100,115], labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']},
  month: {purple:[170,150,155,130,140,95,85], cyan:[185,170,160,155,130,125,105], labels:['1–4','5–8','9–12','13–16','17–20','21–24','25–27']}
};
function chartPoints(values) { return values.map((y,i)=>`${i*100},${y}`).join(' '); }
function updateChart(range) {
  const data = chartSets[range];
  $('#purpleLine').setAttribute('points', chartPoints(data.purple));
  $('#purpleArea').setAttribute('d', `M${data.purple.map((y,i)=>`${i*100} ${y}`).join(' L')} L600 210 L0 210Z`);
  $('#cyanLine').setAttribute('points', chartPoints(data.cyan));
  $('#chartPoints').innerHTML = data.purple.map((y,i)=>`<circle cx="${i*100}" cy="${y}" r="4"/>`).join('');
  $('#xLabels').innerHTML = data.labels.map(label=>`<span>${label}</span>`).join('');
}
$('#chartRange').addEventListener('change', e => { updateChart(e.target.value); toast(e.target.value === 'week' ? 'Showing this week’s demo trend.' : 'Showing this month’s illustrative trend.'); });

// Diagnostic quiz. The score and answered count are kept locally for this browser session.
const questions = [
  {q:"What does Ohm's law state?", hint:"Think about the relationship between voltage, current and resistance.", options:["Voltage is equal to current multiplied by resistance","Current is equal to voltage multiplied by resistance","Resistance is equal to voltage multiplied by current","Voltage is always constant in every circuit"], correct:0, explain:"Ohm’s law is V = IR: voltage equals current multiplied by resistance, when physical conditions are constant."},
  {q:"What is the SI unit of electric current?", hint:"Choose the unit used to measure the rate of charge flow.", options:["Volt (V)","Ohm (Ω)","Ampere (A)","Watt (W)"], correct:2, explain:"Electric current is measured in amperes (A). One ampere means one coulomb of charge flows each second."},
  {q:"Two resistors of 2 Ω and 3 Ω are connected in series. What is their equivalent resistance?", hint:"For resistors in series, add their resistances.", options:["1.2 Ω","5 Ω","6 Ω","2.5 Ω"], correct:1, explain:"Series resistances add: 2 Ω + 3 Ω = 5 Ω."},
  {q:"What is the direction of conventional current in an external circuit?", hint:"Use the conventional positive-to-negative direction.", options:["From negative to positive terminal","From lower to higher resistance only","From positive to negative terminal","It has no direction"], correct:2, explain:"Conventional current is defined as flowing from the positive terminal to the negative terminal through the external circuit."},
  {q:"Which quantity is measured in watts?", hint:"Think of the rate at which electrical energy is transferred.", options:["Charge","Resistance","Potential difference","Power"], correct:3, explain:"Electrical power is measured in watts (W). For a simple DC circuit, P = VI."}
];
let quizIndex=0, selectedAnswer=null, quizAnswers=Array(questions.length).fill(null), quizChecked=Array(questions.length).fill(false), diagnosticScore=null, answeredCount=0;
function renderQuestion() {
  const q=questions[quizIndex]; selectedAnswer=quizAnswers[quizIndex];
  $('#questionCount').textContent=`QUESTION ${quizIndex+1} OF ${questions.length}`;
  $('#quizProgressBar').style.width=`${(quizIndex+1)/questions.length*100}%`;
  $('#questionTitle').textContent=q.q; $('#questionHint').textContent=q.hint;
  $('#answerList').innerHTML=q.options.map((option,i)=>{
    let state=''; if(quizChecked[quizIndex]&&i===q.correct)state=' correct'; else if(quizChecked[quizIndex]&&i===selectedAnswer&&i!==q.correct)state=' incorrect'; else if(i===selectedAnswer)state=' selected';
    return `<button class="answer-option${state}" data-answer="${i}" ${quizChecked[quizIndex]?'disabled':''}><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${option}</span>${quizChecked[quizIndex]&&i===q.correct?'<span class="option-check">✓</span>':''}</button>`;
  }).join('');
  $$('.answer-option').forEach(button=>button.addEventListener('click',()=>{
    if(quizChecked[quizIndex])return;
    selectedAnswer=Number(button.dataset.answer);quizAnswers[quizIndex]=selectedAnswer;
    $$('.answer-option').forEach(b=>b.classList.toggle('selected',Number(b.dataset.answer)===selectedAnswer));
    $('#nextQuestion').disabled=false;
  }));
  $('#prevQuestion').disabled=quizIndex===0;
  $('#nextQuestion').textContent=quizChecked[quizIndex]?(quizIndex===questions.length-1?'View results →':'Next question →'):'Check answer →';
  $('#nextQuestion').disabled=!quizChecked[quizIndex]&&selectedAnswer===null;
  $('#quizResult').classList.add('hidden');
  if(quizChecked[quizIndex]) {
    $('#questionHint').textContent=(selectedAnswer===q.correct?'Correct! ':'Not quite. ')+q.explain;
    $('#nextQuestion').disabled=false;
  }
}
function finishQuiz() {
  diagnosticScore=quizAnswers.reduce((score,answer,i)=>score+(answer===questions[i].correct?1:0),0);
  $('#diagnosticStat').innerHTML=`${diagnosticScore}<span class="out-of">/5</span>`;
  $('#answeredStat').textContent=answeredCount;
  $('#quizContent').classList.add('hidden');$('.quiz-controls').classList.add('hidden');
  const result=$('#quizResult');result.classList.remove('hidden');
  const message=diagnosticScore>=4?'Great foundation! Focus next on applying these ideas to multi-step circuit problems.':diagnosticScore>=3?'You have a good start. Review the explanations for missed questions, then try another practice round.':'This is exactly what a diagnostic is for. Revisit current, voltage and resistance, then retry the questions.';
  result.innerHTML=`<div class="side-icon">✧</div><h3>Diagnostic complete</h3><p>You scored <b>${diagnosticScore} out of ${questions.length}</b>. ${message}</p><button class="primary-button" id="retryQuiz">Try again ↻</button> <button class="secondary-button" id="backOverview">Back to overview</button>`;
  $('#retryQuiz').addEventListener('click',resetQuiz);$('#backOverview').addEventListener('click',()=>goToPage('overview'));
  toast('Diagnostic complete — your session stats have been updated.');
}
function resetQuiz(){quizIndex=0;selectedAnswer=null;quizAnswers=Array(questions.length).fill(null);quizChecked=Array(questions.length).fill(false);diagnosticScore=null;answeredCount=0;$('#quizContent').classList.remove('hidden');$('.quiz-controls').classList.remove('hidden');$('#diagnosticStat').innerHTML=`—<span class="out-of">/5</span>`;$('#answeredStat').textContent='0';renderQuestion();}
$('#nextQuestion').addEventListener('click',()=>{
  if(!quizChecked[quizIndex]){quizChecked[quizIndex]=true;answeredCount++;renderQuestion();$('#questionHint').textContent=(selectedAnswer===questions[quizIndex].correct?'Correct! ':'Not quite. ')+questions[quizIndex].explain;return;}
  if(quizIndex<questions.length-1){quizIndex++;renderQuestion();}else finishQuiz();
});
$('#prevQuestion').addEventListener('click',()=>{if(quizIndex>0){quizIndex--;renderQuestion();}});
renderQuestion();

// Clickable knowledge galaxy nodes update the concept detail card.
const conceptInfo={
  'Current Electricity':{symbol:'⚡',text:'The flow of electric charge through a conductor. Start with current, voltage and resistance before moving into circuit laws.'},
  "Ohm's Law":{symbol:'Ω',text:'Ohm’s law relates potential difference, current and resistance: V = IR. Practise rearranging the equation to find each quantity.'},
  'Resistance':{symbol:'⌁',text:'Resistance describes how strongly a material opposes current. It depends on material, length, cross-sectional area and temperature.'},
  "Kirchhoff's Laws":{symbol:'⌘',text:'Kirchhoff’s current law follows conservation of charge at a junction. Kirchhoff’s voltage law follows conservation of energy around a closed loop.'},
  'Electrical Power':{symbol:'ϟ',text:'Electrical power is the rate of electrical energy transfer. Useful relationships include P = VI, P = I²R and P = V²/R.'},
  'Circuit Analysis':{symbol:'∿',text:'Circuit analysis combines circuit diagrams, Ohm’s law and Kirchhoff’s rules to determine unknown currents and voltages.'},
  'Series & Parallel':{symbol:'⫘',text:'In series, the same current passes through each resistor and resistances add. In parallel, voltage is shared across branches and reciprocal resistances add.'}
};
$$('.node').forEach(node=>node.addEventListener('click',()=>{
  $$('.node').forEach(n=>n.classList.toggle('selected',n===node));
  const name=node.dataset.concept, info=conceptInfo[name];
  $('#conceptDetail').innerHTML=`<div class="detail-symbol">${info.symbol}</div><div><span class="tiny-label">SELECTED CONCEPT</span><h3>${name}</h3><p>${info.text}</p></div><button class="secondary-button" data-go="tutor">Study this concept →</button>`;
  $('#conceptDetail [data-go]').addEventListener('click',()=>{goToPage('tutor');$('#chatInput').value=`Explain ${name} with an example`;$('#chatInput').focus();});
}));

// Local demo tutor: deterministic educational responses; not represented as a live AI model.
const chatForm=$('#chatForm'), chatInput=$('#chatInput'), chatMessages=$('#chatMessages');
function addMessage(text,who='bot') {
  const wrap=document.createElement('div');wrap.className=`chat-message ${who}`;
  if(who==='bot'){
    const avatar=document.createElement('span');avatar.className='message-avatar';avatar.textContent='✧';wrap.appendChild(avatar);
  }
  const box=document.createElement('div');const name=document.createElement('b');name.textContent=who==='bot'?'Mindora':'You';const p=document.createElement('p');p.textContent=text;box.append(name,p);wrap.appendChild(box);chatMessages.appendChild(wrap);chatMessages.scrollTop=chatMessages.scrollHeight;
}
function tutorReply(message){
  const m=message.toLowerCase();
  if(m.includes('ohm')||m.includes('current electricity'))return "Ohm’s law says V = IR, where V is voltage in volts, I is current in amperes and R is resistance in ohms. Example: if a 4 Ω resistor has 2 A flowing through it, V = 2 × 4 = 8 V. Try remembering it as voltage = current × resistance.";
  if(m.includes('study plan')||m.includes('timetable')||m.includes('plan'))return "Here’s a simple 60-minute Class 12 Physics session: 10 min — recall key formulas without notes; 20 min — revise one concept; 20 min — solve 3–5 board-style questions; 10 min — check mistakes and write down what to revisit. Take a short break before your next session.";
  if(m.includes('quiz')||m.includes('practice'))return "Let’s practise! If two resistors of 2 Ω and 3 Ω are connected in series, what is the equivalent resistance? A) 1.2 Ω  B) 5 Ω  C) 6 Ω. Reply with A, B or C and I’ll check it.";
  if(m.includes('kirchhoff'))return "Kirchhoff’s current law: total current entering a junction equals total current leaving it. Kirchhoff’s voltage law: the algebraic sum of potential changes around a closed loop is zero. These rules come from conservation of charge and energy.";
  if(m.includes('integral')||m.includes('math'))return "A definite integral measures accumulated quantity over an interval and can be interpreted as signed area under a curve. For ∫ₐᵇ f(x) dx, find an antiderivative F(x), then calculate F(b) − F(a). Want to try a simple example?";
  if(m.includes('chem')||m.includes('organic'))return "For organic chemistry, try linking each reaction to three things: the functional group, the reagent/conditions, and the product. Make a small reaction map and practise explaining why each change happens.";
  if(m==='a'||m==='b'||m==='c'){return m==='b'?"Correct! In series, resistances add: 2 Ω + 3 Ω = 5 Ω.":"Not quite. The correct answer is B: 2 Ω + 3 Ω = 5 Ω for series resistors.";}
  return "I couldn't reach the AI service. Please check that the server is running and the API key is configured, then try again.";
}
async function sendChat(message){const trimmed=message.trim();if(!trimmed)return;addMessage(trimmed,'user');chatInput.value='';try{const answer=await askAI(trimmed,'chat');addMessage(answer,'bot');}catch(e){addMessage('AI request failed: '+e.message+'. Check the server and API key, then retry.','bot');}}
chatForm.addEventListener('submit',e=>{e.preventDefault();sendChat(chatInput.value);});
$$('[data-prompt]').forEach(button=>button.addEventListener('click',()=>{
  const prompt=button.dataset.prompt;
  if(button.closest('#chatMessages')){sendChat(prompt);}else{goToPage('tutor');sendChat(prompt);}
}));


// --- Class-aware onboarding and local prototype account flow ---
const onboardingScreen = $('#onboardingScreen');
const authModal = $('#authModal');
let authMode = 'login';
const demoUserKey = 'mindora_user_v1';
const demoAccountsKey = 'mindora_demo_accounts_v1';
const classLabels = {
  '6':'Class 6','7':'Class 7','8':'Class 8','9':'Class 9','10':'Class 10',
  '11':'Class 11','12':'Class 12','college':'College / University','other':'Learner'
};
const curriculumByClass = {
  '6': {subjects:['Mathematics','Science','English'], focus:['Fractions & Decimals','Force & Motion','Living Organisms']},
  '7': {subjects:['Mathematics','Science','English'], focus:['Integers & Fractions','Heat & Motion','Nutrition in Plants']},
  '8': {subjects:['Mathematics','Science','English'], focus:['Linear Equations','Force & Pressure','Cell Structure']},
  '9': {subjects:['Mathematics','Physics','Chemistry'], focus:['Polynomials','Motion & Laws','Atoms & Molecules']},
  '10': {subjects:['Mathematics','Physics','Chemistry'], focus:['Quadratic Equations','Electricity','Chemical Reactions']},
  '11': {subjects:['Physics','Chemistry','Mathematics'], focus:['Kinematics','Chemical Bonding','Trigonometry']},
  '12': {subjects:['Physics','Chemistry','Mathematics'], focus:['Current Electricity','Organic Chemistry','Integration']},
  'college': {subjects:['Core Concepts','Problem Solving','Research Skills'], focus:['Subject Foundations','Applied Practice','Project Skills']},
  'other': {subjects:['Core Concepts','Practice','Study Skills'], focus:['Foundations','Practice Questions','Revision Plan']}
};
function setPersonalization(user) {
  const name = (user.name || 'Learner').trim();
  const klass = classLabels[user.class] || 'Learner';
  let curriculum = curriculumByClass[user.class] || curriculumByClass.other;
  const department = user.department || '';
  const collegePaths = {
    'Computer Science / IT': {subjects:['Programming','Data Structures','Database Systems'],focus:['Python / Programming Fundamentals','Data Structures & Algorithms','Database Management Systems']},
    'Computer Science and Engineering': {subjects:['Programming','Data Structures','Database Systems'],focus:['Programming Fundamentals','Data Structures & Algorithms','Database Management Systems']},
    'Computer Science and Design': {subjects:['Programming','UI/UX Design','Software Design'],focus:['Programming Fundamentals','Human-Computer Interaction','Design Thinking']},
    'Information Technology': {subjects:['Programming','Networking','Database Systems'],focus:['Programming Fundamentals','Computer Networks','Database Management Systems']},
    'Electronics & Communication': {subjects:['Electronic Devices','Digital Systems','Communication'],focus:['Semiconductor Devices','Digital Logic Design','Communication Systems']},
    'Electronics and Communication Engineering': {subjects:['Electronic Devices','Digital Systems','Communication'],focus:['Semiconductor Devices','Digital Logic Design','Communication Systems']},
    'Electrical & Electronics': {subjects:['Electrical Machines','Power Systems','Circuit Theory'],focus:['Electrical Circuit Analysis','Electrical Machines','Power System Fundamentals']},
    'Electrical and Electronics Engineering': {subjects:['Electrical Machines','Power Systems','Circuit Theory'],focus:['Electrical Circuit Analysis','Electrical Machines','Power System Fundamentals']},
    'Mechanical Engineering': {subjects:['Engineering Mechanics','Thermodynamics','Manufacturing'],focus:['Engineering Mechanics','Thermodynamics','Manufacturing Processes']},
    'Civil Engineering': {subjects:['Structural Engineering','Surveying','Construction Materials'],focus:['Structural Analysis','Surveying Fundamentals','Concrete Technology']},
    'Artificial Intelligence / Data Science': {subjects:['Python & Data','Machine Learning','Statistics'],focus:['Python for Data Science','Machine Learning Foundations','Probability & Statistics']},
    'Artificial Intelligence and Data Science': {subjects:['Python & Data','Machine Learning','Statistics'],focus:['Python for Data Science','Machine Learning Foundations','Probability & Statistics']},
    'Hotel Management and Catering Technology': {subjects:['Food Production','Hospitality Operations','Food & Beverage Service'],focus:['Culinary Foundations','Front Office Operations','Food & Beverage Service']},
    'MBA': {subjects:['Management','Marketing','Finance'],focus:['Principles of Management','Marketing Strategy','Financial Management']},
    'Commerce': {subjects:['Accounting','Business Economics','Taxation'],focus:['Financial Accounting','Business Economics','Income Tax Fundamentals']},
    'Business Administration / Management': {subjects:['Management','Marketing','Finance'],focus:['Principles of Management','Marketing Fundamentals','Financial Management']},
    'Arts & Humanities': {subjects:['Core Theory','Research Methods','Critical Analysis'],focus:['Core Concepts & Theory','Research Methodology','Critical Reading & Analysis']},
    'Science': {subjects:['Core Science','Practical Methods','Research'],focus:['Subject Foundations','Laboratory & Practical Skills','Scientific Method']},
    'Medicine / Nursing / Allied Health': {subjects:['Anatomy','Physiology','Clinical Foundations'],focus:['Human Anatomy','Human Physiology','Clinical Foundations']},
    'Law': {subjects:['Legal Methods','Constitutional Law','Case Analysis'],focus:['Legal Methods & Reasoning','Constitutional Law','Case Analysis']},
    'Other': {subjects:['Core Concepts','Applied Practice','Research Skills'],focus:['Subject Foundations','Applied Practice','Project Skills']}
  };
  if(user.class==='college' && collegePaths[department]) curriculum=collegePaths[department];
  $('#profileName').textContent = name;
  $('#profileClass').textContent = `${klass}${department ? ' · '+department : ''}${user.course ? ' · '+user.course : ''}`;
  const subjectSelect=$('#syllabusSubject');
  if(subjectSelect){subjectSelect.innerHTML='';[...new Set([...curriculum.subjects,...curriculum.focus])].forEach(subject=>{const option=document.createElement('option');option.textContent=subject;option.value=subject;subjectSelect.appendChild(option);});}
  const syllabusSubtitle=$('#syllabusSubtitle');if(syllabusSubtitle)syllabusSubtitle.textContent=user.class==='college'?`Personalised study guide for ${user.course || 'your course'} · ${department || 'department not selected'}.`:`Personalised study guide for ${klass} · ${user.board || 'your curriculum'}.`;
  const firstName = name.split(/\s+/)[0];
  const welcomeHeading = $('.welcome-row h1');
  if (welcomeHeading) welcomeHeading.innerHTML = `${firstName.replace(/[<>&"]/g,'')}’s potential has <span>no limits.</span>`;
  const subheading = $('.welcome-row .subheading');
  if (subheading) subheading.textContent = `Your ${klass} learning space is ready. Let’s make today count.`;
  const lessonCards = $$('.lesson-card');
  lessonCards.forEach((card,i)=>{
    const subject=curriculum.subjects[i] || curriculum.subjects[0];
    const topic=curriculum.focus[i] || curriculum.focus[0];
    const subjectEl=$('.lesson-subject',card);
    const titleEl=$('h3',card);
    if(subjectEl)subjectEl.textContent=subject.toUpperCase();
    if(titleEl)titleEl.textContent=topic;
    const desc=$('p',card);
    if(desc)desc.textContent=`Build confidence in ${topic.toLowerCase()} with guided examples and practice.`;
  });
  const focusItems=$$('.focus-item');
  focusItems.forEach((item,i)=>{
    const title=$('.focus-info b',item);
    const small=$('.focus-info small',item);
    const percent=$('.focus-percent',item);
    const track=$('.focus-track span',item);
    const topic=curriculum.focus[(i+ (user.class==='12'?0:1))%curriculum.focus.length] || curriculum.focus[0];
    if(title)title.textContent=topic;
    if(small)small.textContent=`${curriculum.subjects[i] || curriculum.subjects[0]} · personalised topic`;
    const values=[42,68,86], value=values[i];
    if(percent)percent.textContent=`${value}%`;
    if(track)track.style.width=`${value}%`;
  });
  const quizSubject=$('.quiz-top .level-pill');
  if(quizSubject)quizSubject.textContent=`${klass.toUpperCase()} · SAMPLE DIAGNOSTIC`;
  // Adjust greeting in the study buddy while preserving the same demo assistant.
  const initialChat=$('#chatMessages .chat-message p');
  if(initialChat)initialChat.textContent=`Hey ${firstName}! 👋 I'm your study buddy for ${klass}. Ask about a topic, get a simple explanation, or build a study plan.`;
  localStorage.setItem(demoUserKey, JSON.stringify(user));
  window.mindoraLearner=user;
}
function dismissOnboarding(user) {
  onboardingScreen.classList.add('dismissed');
  document.body.classList.remove('onboarding-open');
  setPersonalization(user);
  if (typeof renderOfficialSyllabusLinks === 'function') renderOfficialSyllabusLinks();
}
function showOnboarding() {
  onboardingScreen.classList.remove('dismissed');
  document.body.classList.add('onboarding-open');
}
function openAuth(mode='login') {
  setAuthMode(mode);
  authModal.classList.remove('hidden');
  $('#authMessage').textContent='';
  $('#authEmail').focus();
}
function closeAuth() { authModal.classList.add('hidden'); }
function setAuthMode(mode) {
  authMode=mode;
  $$('.auth-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.authMode===mode));
  const signup=mode==='signup';
  $('#authTitle').innerHTML=signup?'Create your <span>account.</span>':'Welcome <span>back.</span>';
  $('#authSubtitle').textContent=signup?'Save a demo profile on this browser to continue.':'Log in to continue your learning journey.';
  $('#authNameWrap').classList.toggle('hidden',!signup);
  $('#authName').required=signup;
  $('#authSubmit').innerHTML=signup?'Create demo account <span>→</span>':'Log in securely <span>→</span>';
  $('#authPassword').autocomplete=signup?'new-password':'current-password';
  $('#authMessage').textContent='';
}
function readAccounts() {
  try { return JSON.parse(localStorage.getItem(demoAccountsKey) || '{}'); } catch { return {}; }
}
$('#onboardingForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=$('#studentName').value.trim(), klass=$('#studentClass').value, board=$('#studentBoard').value;
  const department=$('#studentDepartment').value, course=$('#studentCourse').value.trim(), college=$('#studentCollege')?.value||'vjcet', semester=$('#studentSemester')?.value||'S1';
  if(!name || !klass){toast('Please add your name and choose your class.');return;}
  if(klass==='college' && !department){toast('Choose your college department first.');$('#studentDepartment').focus();return;}
  dismissOnboarding({name,class:klass,board,department:klass==='college'?department:'',course:klass==='college'?course:'',college:klass==='college'?college:'',semester:klass==='college'?semester:'',guest:true});
  toast(`Your ${classLabels[klass]} learning space is ready ✦`);
});
$('#openAuthFromWelcome').addEventListener('click',()=>openAuth('login'));
$('#closeAuth').addEventListener('click',closeAuth);
authModal.addEventListener('click',e=>{if(e.target===authModal)closeAuth();});
$$('.auth-tab').forEach(tab=>tab.addEventListener('click',()=>setAuthMode(tab.dataset.authMode)));
$('#authForm').addEventListener('submit',e=>{
  e.preventDefault();
  const email=$('#authEmail').value.trim().toLowerCase(), password=$('#authPassword').value;
  const message=$('#authMessage');
  if(password.length<6){message.textContent='Use at least 6 characters for this demo password.';return;}
  const accounts=readAccounts();
  if(authMode==='signup'){
    const name=$('#authName').value.trim();
    if(!name){message.textContent='Please enter your name.';return;}
    if(accounts[email]){message.textContent='A demo account with this email already exists. Try logging in.';return;}
    const chosenClass=$('#studentClass').value || '12';
    const chosenBoard=$('#studentBoard').value || 'CBSE';
    const department=$('#studentDepartment').value, course=$('#studentCourse').value.trim(), college=$('#studentCollege')?.value||'vjcet', semester=$('#studentSemester')?.value||'S1';
    if(chosenClass==='college'&&!department){message.textContent='Please choose your college department on the welcome screen first.';return;}
    // This is only a local prototype. Never use a real password here.
    accounts[email]={name,class:chosenClass,board:chosenBoard,department:chosenClass==='college'?department:'',course:chosenClass==='college'?course:'',college:chosenClass==='college'?college:'',semester:chosenClass==='college'?semester:'',password};
    localStorage.setItem(demoAccountsKey,JSON.stringify(accounts));
    const user={name,class:chosenClass,board:chosenBoard,department:chosenClass==='college'?department:'',course:chosenClass==='college'?course:'',college:chosenClass==='college'?college:'',semester:chosenClass==='college'?semester:'',email};
    dismissOnboarding(user);closeAuth();toast('Demo account created on this browser.');
  } else {
    const account=accounts[email];
    if(!account || account.password!==password){message.textContent='No matching local demo account. Sign up here, or continue as a guest.';return;}
    dismissOnboarding({...account,email});closeAuth();toast('Welcome back to MINDORA AI ✦');
  }
});
const storedUser=(()=>{try{return JSON.parse(localStorage.getItem(demoUserKey)||'null')}catch{return null}})();
if(storedUser && storedUser.name && storedUser.class){dismissOnboarding(storedUser);}else{document.body.classList.add('onboarding-open');}


// Show department and degree fields only for college learners.
const classSelect=$('#studentClass'), departmentWrap=$('#departmentWrap');
function syncEducationFields(){const college=classSelect.value==='college';departmentWrap.classList.toggle('hidden',!college);$('#studentDepartment').required=college;$('#studentCourse').required=false;$('label[for="studentBoard"]').classList.toggle('hidden',college);$('#studentBoard').parentElement.classList.toggle('hidden',college);}
classSelect.addEventListener('change',syncEducationFields);syncEducationFields();

// AI-powered syllabus and summaries through the optional local Python API.
function learnerContext(){const u=window.mindoraLearner||storedUser||{};return {name:u.name||'Learner',education:u.class==='college'?'College / University':(classLabels[u.class]||'Learner'),college:u.college==='vjcet'?'Viswajyothi College of Engineering and Technology (VJCET)':(u.college||''),department:u.department||'',course:u.course||'',semester:u.semester||$('#studentSemester')?.value||'S1',curriculum:u.board||'',subject:$('#syllabusSubject')?.value||'',term:($('#syllabusTerm')?.value||'Full course')};}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function askAI(prompt, task='chat'){const context=learnerContext();const response=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task,prompt,context})});if(!response.ok)throw new Error('AI server unavailable');const data=await response.json();if(!data.text)throw new Error('No AI response');return data.text;}
function renderAIText(text){return escapeHtml(text).replace(/\n/g,'<br>');}
async function buildStudyContent(kind){const btn=kind==='summary'?$('#generateSummary'):$('#generateSyllabus');const old=btn.innerHTML;btn.disabled=true;btn.textContent='✦ Thinking...';$('#syllabusMode').textContent='GENERATING';try{const context=learnerContext();const prompt=kind==='summary'?`Create a concise student-friendly summary for ${context.subject}, course ${context.course}, department ${context.department}, semester ${context.semester}. Include key ideas, definitions, formulas/frameworks, an example, and 5 revision points. If this is VJCET, clearly distinguish verified syllabus facts from general explanation; do not pretend you have read a PDF unless its contents are supplied in context.`:`Create a structured study roadmap for ${context.subject}, ${context.college}, ${context.course}, ${context.department}, ${context.semester}. Prefer the college's official syllabus source: https://vjcet.org/syllabus-and-curriculum. Include modules/topics, learning outcomes, practicals and assessment preparation. Do not invent exact official syllabus details. If the exact document content is not available to you, say so and provide a clearly labelled study guide rather than claiming it is the official syllabus.`;const text=await askAI(prompt,kind==='summary'?'summary':'syllabus');$('#syllabusTitle').textContent=kind==='summary'?'Smart summary':'Generated study roadmap';$('#syllabusMeta').textContent=`${context.education}${context.department?' · '+context.department:''}${context.course?' · '+context.course:''} · ${context.subject}`;$('#syllabusContent').innerHTML=`<div class="ai-generated-text">${renderAIText(text)}</div>`;$('#syllabusMode').textContent='LIVE AI';toast('Study content generated ✦');}catch(err){$('#syllabusTitle').textContent='AI service unavailable';$('#syllabusContent').innerHTML=`<div class="ai-generated-text">${renderAIText(err.message||'Could not reach the AI service. Start the server and configure OPENAI_API_KEY, then try again. No sample answer was substituted.')}</div>`;$('#syllabusMode').textContent='NOT CONNECTED';toast('Live AI unavailable — check server configuration.');}finally{btn.disabled=false;btn.innerHTML=old;}}
$('#generateSyllabus').addEventListener('click',()=>buildStudyContent('syllabus'));$('#generateSummary').addEventListener('click',()=>buildStudyContent('summary'));
$('#supportForm').addEventListener('submit',e=>{e.preventDefault();const request={category:$('#supportCategory').value,email:$('#supportEmail').value.trim(),message:$('#supportMessage').value.trim(),learner:learnerContext(),createdAt:new Date().toISOString()};const requests=JSON.parse(localStorage.getItem('mindora_support_requests')||'[]');requests.push(request);localStorage.setItem('mindora_support_requests',JSON.stringify(requests));$('#supportResult').classList.remove('hidden');$('#supportResult').textContent='Request prepared and saved in this browser. Reference: MN-'+Date.now().toString().slice(-6)+'. No real support team has been contacted.';$('#supportMessage').value='';toast('Support request saved locally.');});


// Official VJCET documents. URLs are taken from the college's published Syllabus & Curriculum page.
const vjcetSyllabus = {
  'Artificial Intelligence and Data Science': {s12:'https://vjcet.org/storage/upload/images/UVTtQJ7NoKjsjeTMVDydIliXkccHCmscPuMTbBGc.pdf', s38:'https://vjcet.org/storage/upload/images/UVTtQJ7NoKjsjeTMVDydIliXkccHCmscPuMTbBGc.pdf'},
  'Civil Engineering': {s12:'https://vjcet.org/syllabus-and-curriculum', s38:'https://vjcet.org/syllabus-and-curriculum'},
  'Computer Science and Design': {s12:'https://vjcet.org/syllabus-and-curriculum', s38:'https://vjcet.org/syllabus-and-curriculum'},
  'Computer Science and Engineering': {s12:'https://vjcet.org/storage/upload/images/Oi8LP3jFbGQ35fHGi2Q4r9KIRhG8kcXw98PwxCLO.pdf', s38:'https://vjcet.org/storage/upload/images/iH2rAX4pFmAtWjHNrOvavUpbBkDWLSHcXupTEJc0.pdf'},
  'Electronics and Communication Engineering': {s12:'https://vjcet.org/storage/upload/images/l3vT03wEcZebOnrpILQFTOr8tGu78BAs2STx4tlw.pdf', s38:'https://vjcet.org/storage/upload/images/HXqvO0zV1owv3sy4pOYKFukgM7bfpgGYfEAyxK6V.pdf'},
  'Electrical and Electronics Engineering': {s12:'https://vjcet.org/storage/upload/images/ow2RXjMnfDkyQpX4GXjJ9VxlgP6MxZruIHzO9lvY.pdf', s38:'https://vjcet.org/syllabus-and-curriculum'},
  'Information Technology': {s12:'https://vjcet.org/storage/upload/images/ob0VmBOznzfoVvFwT0CFz1iluzLQO6uU06948aM5.pdf', s38:'https://vjcet.org/storage/upload/images/QUna8EexngX896XAf5duBOKGfY9pzZrt3EqSWEI6.pdf'},
  'Mechanical Engineering': {s12:'https://vjcet.org/storage/upload/images/jA8lcXn1nu6EM7ALt3xb4xaIPwavxtapLdSl2TtT.pdf', s38:'https://vjcet.org/storage/upload/images/cha9nqt585lloerCYr0HNgcPjegy6ZeqBJ3KEVEs.pdf'},
  'Hotel Management and Catering Technology': {s12:'https://vjcet.org/syllabus-and-curriculum', s38:'https://vjcet.org/syllabus-and-curriculum'},
  'MBA': {s12:'https://vjcet.org/syllabus-and-curriculum', s38:'https://vjcet.org/syllabus-and-curriculum'},
  'Other': {s12:'https://vjcet.org/syllabus-and-curriculum', s38:'https://vjcet.org/syllabus-and-curriculum'}
};
function renderOfficialSyllabusLinks(){
 const target=$('#officialSyllabusLinks'); if(!target)return;
 const user=window.mindoraLearner||storedUser||{};
 const department=user.department||$('#studentDepartment')?.value||'Computer Science and Engineering';
 const urls=vjcetSyllabus[department]||vjcetSyllabus.Other;
 target.innerHTML='';
 const cards=[['Semester 1–2 syllabus',urls.s12],['Semester 3–8 syllabus',urls.s38],['All courses, curriculum & regulations','https://vjcet.org/syllabus-and-curriculum']];
 cards.forEach(([label,url])=>{const a=document.createElement('a');a.className='syllabus-unit official-link';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.innerHTML=`<b>${escapeHtml(label)} ↗</b><p>Open the official VJCET source in a new tab.</p>`;target.appendChild(a);});
}
renderOfficialSyllabusLinks();
