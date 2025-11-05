<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<!-- === SCRIPT UNTOUCHED EXCEPT UNIQUE BOSS LOCALSTORAGE === -->
<script>
  const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1433449406056763557/nifC_lCD78cMTOoMY6ryDBlain76udKiIEVOitIWT_n8XqygjGj_GWU0zDEf8v6GTxGu";

  async function sendToDiscord(message) {
    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
      });
    } catch (err) {
      console.error("Discord error:", err);
    }
  }

  const fieldTab = document.getElementById("tabField");
  const uniqueTab = document.getElementById("tabUnique");
  const fieldContainer = document.getElementById("fieldContainer");
  const uniqueContainer = document.getElementById("uniqueContainer");

  fieldTab.onclick = () => {
    fieldTab.classList.add("active");
    uniqueTab.classList.remove("active");
    fieldContainer.classList.add("active");
    uniqueContainer.classList.remove("active");
  };
  uniqueTab.onclick = () => {
    uniqueTab.classList.add("active");
    fieldTab.classList.remove("active");
    uniqueContainer.classList.add("active");
    fieldContainer.classList.remove("active");
  };

  const bossList = [
    { name: "Venatus", hours: 10, location: "Corrupted Basin" },
    { name: "Viorent", hours: 10, location: "Crescent Lake" },
    { name: "Ego", hours: 21, location: "Ulan Canyon" },
    { name: "Livera", hours: 24, location: "Protectors Ruins" },
    { name: "Araneo", hours: 24, location: "Lower Tomb of Tyriosa 1F" },
    { name: "Undomiel", hours: 24, location: "Secret Laboratory" },
    { name: "Lady Dalia", hours: 18, location: "Twilight Hill" },
    { name: "General Aquleus", hours: 29, location: "Lower Tomb of Tyriosa 2F" },
    { name: "Amentis", hours: 29, location: "Land of Glory" },
    { name: "Baron Braudmore", hours: 32, location: "Battlefield of Templar" },
    { name: "Wannitas", hours: 48, location: "Plateau of Revolution" },
    { name: "Metus", hours: 48, location: "Plateau of Revolution" },
    { name: "Duplican", hours: 48, location: "Plateau of Revolution" },
    { name: "Shuliar", hours: 35, location: "Ruins of the War" },
    { name: "Gareth", hours: 32, location: "Deadmans Land District 1" },
    { name: "Titore", hours: 37, location: "Deadmans Land District 2" },
    { name: "Larba", hours: 35, location: "Ruins of the War" },
    { name: "Catena", hours: 35, location: "Deadmans Land District 3" },
    { name: "Secreta", hours: 62, location: "Silvergrass Field" },
    { name: "Ordo", hours: 62, location: "Silvergrass Field" },
    { name: "Asta", hours: 62, location: "Silvergrass Field" },
    { name: "Supore", hours: 62, location: "Silvergrass Field" }
  ];

  let timers = JSON.parse(localStorage.getItem("bossTimers") || "[]");
  const bossSelect = document.getElementById("bossSelect");
  const acquiredInput = document.getElementById("acquiredInput");
  const addBtn = document.getElementById("addBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const timerBody = document.getElementById("timerBody");
  const fieldDiscordBtn = document.getElementById("fieldDiscordBtn");

  bossList.forEach(boss => {
    const opt = document.createElement("option");
    opt.value = boss.name;
    opt.textContent = `${boss.name} (${boss.hours}h)`;
    bossSelect.appendChild(opt);
  });

  function saveTimers() {
    localStorage.setItem("bossTimers", JSON.stringify(timers));
  }

  function addTimer() {
    const bossName = bossSelect.value;
    const acquiredVal = acquiredInput.value;
    if (!bossName || !acquiredVal) return alert("Please select a boss and time.");
    const boss = bossList.find(b => b.name === bossName);
    const acquired = new Date(acquiredVal);
    const nextSpawn = new Date(acquired.getTime() + boss.hours * 3600000);
    timers.push({ id: Date.now(), name: boss.name, location: boss.location, acquired, nextSpawn, warned10: false, announced: false });
    saveTimers();
    renderTimers();
    acquiredInput.value = "";
  }

  function deleteTimer(id) {
    timers = timers.filter(t => t.id !== id);
    saveTimers();
    renderTimers();
  }

  async function renderTimers() {
    const now = Date.now();
    timerBody.innerHTML = "";
    timers.sort((a, b) => new Date(a.nextSpawn) - new Date(b.nextSpawn))
      .forEach(async t => {
        const next = new Date(t.nextSpawn).getTime();
        const remain = Math.max(0, next - now);
        const mins = Math.floor(remain / 60000);
        const expired = remain <= 0;

        if (mins === 10 && !t.warned10) {
          await sendToDiscord(`${t.name} spawns in 10 mins at ${t.location}`);
          t.warned10 = true;
          saveTimers();
        }
        if (expired && !t.announced) {
          await sendToDiscord(`${t.name} has spawned at ${t.location}`);
          t.announced = true;
          saveTimers();
        }

        const hrs = Math.floor(remain / 3600000);
        const tr = document.createElement("tr");
        if (expired) tr.classList.add("expired");
        tr.innerHTML = `
          <td>${t.name}</td>
          <td>${t.location}</td>
          <td>${new Date(t.acquired).toLocaleString()}</td>
          <td>${new Date(t.nextSpawn).toLocaleString()}</td>
          <td>${expired ? "Spawned!" : `${hrs}h ${mins % 60}m`}</td>
          <td><button class="danger" data-id="${t.id}">Delete</button></td>
        `;
        tr.querySelector(".danger").onclick = () => deleteTimer(t.id);
        timerBody.appendChild(tr);
      });
  }

  addBtn.onclick = addTimer;
  clearAllBtn.onclick = () => {
    if (confirm("Clear all timers?")) {
      timers = [];
      saveTimers();
      renderTimers();
    }
  };

  fieldDiscordBtn.onclick = async () => {
    if (timers.length === 0) return alert("No active timers!");
    const grouped = {};
    timers.forEach(t => {
      const d = new Date(t.nextSpawn);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(`${timeStr} - ${t.name} - ${t.location}`);
    });
    let msg = "**Field Boss Schedule**\n";
    for (const [date, entries] of Object.entries(grouped)) {
      msg += `\n${date}\n${entries.join("\n")}\n`;
    }
    await sendToDiscord(msg.trim());
    alert("Field Boss schedule sent to Discord!");
  };

  const uniqueNameInput = document.getElementById("uniqueNameInput");
  const uniqueTimeSelect = document.getElementById("uniqueTimeSelect");
  const uniqueAddBtn = document.getElementById("uniqueAddBtn");
  const uniqueBody = document.getElementById("uniqueBody");

  let uniqueTimers = JSON.parse(localStorage.getItem("uniqueTimers") || "[]");

  function saveUniqueTimers() {
    localStorage.setItem("uniqueTimers", JSON.stringify(uniqueTimers));
  }

  function speakAlert(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;
    speechSynthesis.speak(utter);
  }

  function renderUniqueTimers() {
    uniqueBody.innerHTML = "";
    const now = Date.now();
    uniqueTimers = uniqueTimers.filter(u => u.endTime > now);
    uniqueTimers.forEach(u => {
      const remain = Math.max(0, u.endTime - now);
      const mins = Math.floor(remain / 60000);
      const secs = Math.floor((remain % 60000) / 1000);

      if (mins === 3 && !u.alerted3min) {
        speakAlert(`${u.name} will spawn in three minutes.`);
        u.alerted3min = true;
        saveUniqueTimers();
      }

      const tr = document.createElement("tr");
      if (remain <= 0) tr.classList.add("expired");
      tr.innerHTML = `
        <td>${u.name}</td>
        <td>${remain <= 0 ? "Spawned!" : `${mins}m ${secs}s`}</td>
        <td><button class="danger" data-id="${u.id}">Delete</button></td>
      `;
      tr.querySelector(".danger").onclick = () => {
        uniqueTimers = uniqueTimers.filter(x => x.id !== u.id);
        saveUniqueTimers();
        renderUniqueTimers();
      };
      uniqueBody.appendChild(tr);
    });
    saveUniqueTimers();
  }

  uniqueAddBtn.onclick = () => {
    const name = uniqueNameInput.value.trim();
    const mins = parseInt(uniqueTimeSelect.value);
    if (!name) return alert("Enter a boss name.");
    const endTime = Date.now() + mins * 60000;
    uniqueTimers.push({ id: Date.now(), name, endTime });
    saveUniqueTimers();
    uniqueNameInput.value = "";
    renderUniqueTimers();
  };

  setInterval(() => {
    renderTimers();
    renderUniqueTimers();
  }, 1000);

  renderTimers();
  renderUniqueTimers();

  const socket = io();

  socket.on("init", (data) => {
    timers = data.bossTimers || [];
    uniqueTimers = data.uniqueTimers || [];
    saveTimers();
    saveUniqueTimers();
    renderTimers();
    renderUniqueTimers();
  });

  socket.on("updateField", (newTimers) => {
    timers = newTimers || [];
    saveTimers();
    renderTimers();
  });

  socket.on("updateUnique", (newTimers) => {
    uniqueTimers = newTimers || [];
    saveUniqueTimers();
    renderUniqueTimers();
  });

  const _saveTimers = saveTimers;
  saveTimers = function () {
    _saveTimers();
    socket.emit("updateField", timers);
  };

  const _saveUniqueTimers = saveUniqueTimers;
  saveUniqueTimers = function () {
    _saveUniqueTimers();
    socket.emit("updateUnique", uniqueTimers);
  };
</script>

<!-- === FIX: Ensure Unique Boss Table Displays === -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const fixUniqueVisible = () => {
    try {
      const uniqueContainer = document.getElementById("uniqueContainer");
      const uniqueBody = document.getElementById("uniqueBody");
      if (uniqueContainer && uniqueBody && typeof renderUniqueTimers === "function") {
        renderUniqueTimers();
        uniqueContainer.style.display = "block";
      }
    } catch (err) {
      console.warn("⚠️ Unique boss fix skipped:", err);
    }
  };
  fixUniqueVisible();
  setTimeout(fixUniqueVisible, 1000);
});
</script>
