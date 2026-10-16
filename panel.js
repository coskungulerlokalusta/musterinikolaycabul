// Panel davranışları. Satır içi <script> ve onclick yerine ayrı dosyada tutulur;
// böylece sunucu "script-src 'self'" gibi bir CSP gönderse bile butonlar çalışır.
(function(){
  function login(){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app-shell').style.display='block';
  }
  function logout(){
    document.getElementById('app-shell').style.display='none';
    document.getElementById('login-screen').style.display='flex';
  }
  function showPage(name){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+name).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n=>{
      n.classList.toggle('active', n.getAttribute('data-page')===name);
    });
  }

  const sampleResults = [
    ['Nilüfer Hırdavat San. Tic.', 'Nilüfer, Bursa', '0224 xxx xx xx'],
    ['Karaca Toptan Malzeme', 'Osmangazi, Bursa', '0224 xxx xx xx'],
    ['Aydın Nalburiye Ltd.', 'Yıldırım, Bursa', '0224 xxx xx xx'],
    ['Ege Hırdavat Merkezi', 'Nilüfer, Bursa', '0224 xxx xx xx'],
    ['Bursa Toptan Vida', 'Osmangazi, Bursa', '0224 xxx xx xx'],
  ];

  function runSearch(){
    const body = document.getElementById('results-body');
    body.innerHTML='';
    sampleResults.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r[0]}</td><td>${r[1]}</td><td class="tel-ok">${r[2]}</td>`;
      body.appendChild(tr);
    });
    document.getElementById('results-empty').style.display='none';
    document.getElementById('results-wrap').style.display='block';
    document.getElementById('results-count').textContent = sampleResults.length + ' işletme bulundu';
    document.getElementById('netgsm-list-info').textContent = sampleResults.length + ' işletme Apify Arama\'dan aktarıldı, gönderime hazır.';
  }

  function updateCharCount(){
    document.getElementById('char-count').textContent = document.getElementById('sms-text').value.length;
  }

  function previewSms(){
    const box = document.getElementById('sms-preview-box');
    document.getElementById('sms-preview-text').textContent = document.getElementById('sms-text').value;
    box.classList.add('show');
  }
  function sendSms(){
    alert('Demo görünümde gönderim simülasyonu — canlı sistemde bu adımda Netgsm üzerinden gerçek gönderim yapılır.');
  }

  const actions = {
    'login': login,
    'logout': logout,
    'search': runSearch,
    'preview-sms': previewSms,
    'send-sms': sendSms,
  };

  document.addEventListener('click', function(e){
    const nav = e.target.closest('.nav-item[data-page]');
    if(nav){ showPage(nav.getAttribute('data-page')); return; }
    const go = e.target.closest('[data-goto]');
    if(go){ showPage(go.getAttribute('data-goto')); return; }
    const act = e.target.closest('[data-action]');
    if(act && actions[act.getAttribute('data-action')]) actions[act.getAttribute('data-action')]();
  });

  // Şifre alanında Enter'a basınca da giriş yapılsın
  ['email','pass'].forEach(id=>{
    document.getElementById(id).addEventListener('keydown', e=>{ if(e.key==='Enter') login(); });
  });

  document.getElementById('sms-text').addEventListener('input', updateCharCount);
  updateCharCount();
})();
