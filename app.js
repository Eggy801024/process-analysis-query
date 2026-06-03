const USERS = {
    "P1339": "P1339",
    "P0949": "P0949"
};

function showLogin(){
    const loginPage = document.getElementById("loginPage");
    const appPage = document.getElementById("appPage");
    if(loginPage) loginPage.style.display = "flex";
    if(appPage) appPage.style.display = "none";
}

function showApp(user){
    const loginPage = document.getElementById("loginPage");
    const appPage = document.getElementById("appPage");
    const currentUser = document.getElementById("currentUser");
    if(loginPage) loginPage.style.display = "none";
    if(appPage) appPage.style.display = "block";
    if(currentUser) currentUser.textContent = user;
}

function login(){
    const user = String(document.getElementById("loginUser").value || "").trim().toUpperCase();
    const pass = String(document.getElementById("loginPass").value || "").trim().toUpperCase();
    const err = document.getElementById("loginError");

    if(USERS[user] && USERS[user].toUpperCase() === pass){
        sessionStorage.setItem("processAnalysisUser", user);
        if(err) err.style.display = "none";
        showApp(user);
        return;
    }

    if(err) err.style.display = "block";
}

function logout(){
    sessionStorage.removeItem("processAnalysisUser");
    showLogin();
}

function checkAuth(){
    const user = sessionStorage.getItem("processAnalysisUser");
    if(user && USERS[user]){
        showApp(user);
    }else{
        showLogin();
    }
}

document.addEventListener("keydown", function(e){
    if(e.key === "Enter" && document.getElementById("loginPage")?.style.display !== "none"){
        login();
    }
});


const $=id=>document.getElementById(id);

function norm(v){
    return String(v||'').trim().toLowerCase();
}

function clean(v){
    return norm(v)
        .replace(/[\s\u3000]/g,'')
        .replace(/[\/\\\-＿_]/g,'')
        .replace(/[()（）【】\[\]{}<>《》]/g,'')
        .replace(/[:：;；,，.。|｜+＋&＆]/g,'');
}

const REASON_ALIASES = {
    "cell隱破裂": [
        "cell隱破裂",
        "cell隱破",
        "cell破裂",
        "cell隱/破裂",
        "cell crack",
        "cellcrack"
    ],
    "背面ribbon歪斜": [
        "背面ribbon歪斜",
        "ribbon歪斜",
        "backside ribbon shift",
        "backsideribbonshift",
        "ribbon shift",
        "ribbonshift"
    ],
    "背面異物": [
        "背面異物",
        "背面 foreign materials",
        "backside foreign materials",
        "backsideforeignmaterials"
    ],
    "電池非電池區異物": [
        "電池非電池區異物",
        "電池/非電池區異物",
        "foreign materials",
        "foreignmaterials"
    ],
    "空焊": [
        "空焊",
        "solder empty",
        "solderempty"
    ],
    "電池非電池區氣泡": [
        "電池非電池區氣泡",
        "電池/非電池區氣泡",
        "氣泡",
        "blister in active / inactive area",
        "blisterinactivearea",
        "blisterinactiveactivearea"
    ],
    "cell缺角": [
        "cell缺角",
        "缺角",
        "cell notch",
        "cellnotch"
    ],
    "片間距異常": [
        "片間距異常",
        "間距異常",
        "the distance between cells is ng",
        "thedistancebetweencellsisng"
    ],
    "cell無效能": [
        "cell無效能",
        "無效能",
        "cell has no function",
        "cellhasnofunction"
    ],
    "cell來料異常": [
        "cell來料異常",
        "來料異常",
        "the incoming cell is ng",
        "incomingcellisng"
    ],
    "玻璃氣泡": [
        "玻璃氣泡",
        "glass bubble",
        "glassbubble"
    ],
    "玻璃刮傷": [
        "玻璃刮傷",
        "glass scratch",
        "glassscratch"
    ],
    "玻璃異物": [
        "玻璃異物",
        "glass foreign material",
        "glassforeignmaterial"
    ],
    "膠膜氣泡": [
        "膠膜氣泡",
        "eva氣泡",
        "poe氣泡",
        "encapsulant bubble",
        "evabubble",
        "poebubble"
    ],
    "膠膜異物": [
        "膠膜異物",
        "eva異物",
        "poe異物",
        "encapsulant foreign material",
        "evaforeignmaterial",
        "poeforeignmaterial"
    ],
    "錫珠": [
        "錫珠",
        "solder ball",
        "solderball"
    ],
    "錫絲": [
        "錫絲",
        "solder wire",
        "solderwire"
    ],
    "助焊劑殘留": [
        "助焊劑殘留",
        "flux residue",
        "fluxresidue"
    ],
    "匯流條歪斜": [
        "匯流條歪斜",
        "busbar歪斜",
        "busbar shift",
        "busbarshift"
    ],
    "匯流條異常": [
        "匯流條異常",
        "busbar異常",
        "busbar ng",
        "busbarng"
    ],
    "鋁框來料異常": [
        "鋁框來料異常",
        "鋁框來料",
        "aluminum frame incoming",
        "abnormal aluminum frame from incoming"
    ]
};

function variants(v){
    const base = clean(v);
    const set = new Set();
    if(base) set.add(base);

    Object.entries(REASON_ALIASES).forEach(([main, list])=>{
        const mainKey = clean(main);
        const aliasKeys = list.map(clean).filter(Boolean);

        const hit = aliasKeys.some(alias =>
            base === alias ||
            base.includes(alias) ||
            alias.includes(base)
        );

        if(hit){
            set.add(mainKey);
            aliasKeys.forEach(alias=>set.add(alias));
        }
    });

    return [...set].filter(Boolean);
}

function fuzzyHit(a,b){
    if(!a || !b) return false;

    const av = variants(a);
    const bv = variants(b);

    return av.some(x =>
        bv.some(y =>
            x === y ||
            x.includes(y) ||
            y.includes(x)
        )
    );
}

function reasonMatch(recordReason,selected){
    if(!selected) return true;

    const fields = [
        selected.中文名稱,
        selected.英文名稱,
        selected.異常代碼
    ];

    return fields.some(field => fuzzyHit(recordReason, field)) ||
           fuzzyHit(recordReason, fields.join(' '));
}

function dateMatch(recordDate,selectedDate){
    if(!selectedDate) return true;
    if(!recordDate) return false;

    const r = String(recordDate).trim().replaceAll('/','-');
    return r === selectedDate || r.startsWith(selectedDate);
}

function gradeMatch(recordGrade,selectedGrade){
    if(!selectedGrade) return true;

    const g = clean(recordGrade);
    const s1 = clean(selectedGrade);
    const s2 = clean(selectedGrade.replace('規',''));

    return g === s1 || g === s2 || g.includes(s2);
}

function init(){
    const sel=$('reason');

    MES_REASONS.forEach((r,i)=>{
        const o=document.createElement('option');
        o.value=i;
        o.textContent=`${r.異常代碼}｜${r.中文名稱}${r.英文名稱?'｜'+r.英文名稱:''}`;
        sel.appendChild(o);
    });

    $('total').textContent=DB_RECORDS.length;
    $('reasonCount').textContent=MES_REASONS.length;
}

function searchData(){
    const line=$('line').value,
          date=$('date').value,
          shift=$('shift').value,
          grade=$('grade').value,
          kw=norm($('keyword').value);

    const selected=$('reason').value===''?null:MES_REASONS[Number($('reason').value)];

    $('currentReason').textContent=selected?selected.中文名稱:'全部';

    const rows=DB_RECORDS.filter(r=>{
        if(line && norm(r.線別)!==norm(line)) return false;
        if(!dateMatch(r.日期,date)) return false;
        if(shift && norm(r.班別)!==norm(shift)) return false;
        if(!gradeMatch(r.模組等級,grade)) return false;
        if(selected && !reasonMatch(r.降規原因,selected)) return false;
        if(kw && !clean(Object.values(r).join(' ')).includes(clean(kw))) return false;

        return true;
    });

    $('matched').textContent=rows.length;
    render(rows);
}

function esc(s){
    return String(s||'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
}

function render(rows){
    const box=$('results');

    if(!rows.length){
        box.className='empty';
        box.innerHTML='查無符合資料。可改用「異常分析關鍵字」或放寬條件查詢。';
        return;
    }

    box.className='';

    box.innerHTML=rows.slice(0,300).map((r,i)=>`
        <article class="result">
            <div class="reasonRow">
                <b>#${i+1} ${esc(r.降規原因)}</b>
                <span class="tag">${esc(r.線別)}</span>
                <span class="tag">${esc(r.日期)}</span>
                <span class="tag">${esc(r.班別)}</span>
                <span class="tag">${esc(r.模組等級)}</span>
            </div>
            <p class="small">
                模組序號：${esc(r.模組序號)}
                ｜STR：${esc(r.STR)}
                ｜LAM：${esc(r.LAM)}
                ｜位置：${esc(r.位置)}
                ｜返修/Q退：${esc(r['返修/Q退'])}
            </p>
            <p><b>現象描述：</b>${esc(r.現象描述)||'—'}</p>
            <p><b>異常 root cause：</b>${esc(r['異常root cause'])||'—'}</p>
            <div>
                <b>異常分析：</b>
                <div class="analysis">${esc(r.異常分析)||'—'}</div>
            </div>
            <p><b>規格：</b>${esc(r.規格)||'—'}</p>
        </article>
    `).join('')+(rows.length>300?'<p class="small">僅顯示前 300 筆，請縮小查詢條件。</p>':'');
}

function resetForm(){
    ['line','date','shift','grade','reason','keyword'].forEach(id=>$(id).value='');

    $('matched').textContent='0';
    $('currentReason').textContent='未選擇';
    $('results').className='empty';
    $('results').textContent='請選擇條件後按「查詢異常分析」。';
}

init();
checkAuth();
