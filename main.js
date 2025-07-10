window.onload = function() {
  var steps = [
    "Inicio de empaste",
    "Fin empaste - Inicio de sacarificacion",
    "Inicio de recirculado",
    "Fin de recirculado - Inicio del trasvase",
    "Inicio de lavado",
    "Fin de lavado",
    "Fin de trasvase",
    "Inicio de hervido",
    "Fin de hervido",
    "Inicio de whirlpool",
    "Fin de whirlpool",
    "Inicio de hopstand",
    "Fin de hopstand",
    "Inicio de enfriamiento",
    "Fin de enfriamiento"
  ];

  // Alarm intervals in seconds (undefined or 0 for steps without alarm)
  var alarmIntervals = {
    1: 20 * 60,
    2: 15 * 60,
    3: 90 * 60,
    7: 60 * 60,
    9: 20 * 60,
    11: 10 * 60
  };

  // Steps with alarms and their default values (in minutes)
  var alarmSteps = [
    { idx: 1, label: "Fin empaste - Inicio de sacarificacion", "default": 20 },
    { idx: 2, label: "Inicio de recirculado", "default": 15 },
    { idx: 3, label: "Fin de recirculado - Inicio del trasvase", "default": 90 },
    { idx: 7, label: "Inicio de hervido", "default": 60 },
    { idx: 9, label: "Inicio de whirlpool", "default": 20 },
    { idx: 11, label: "Inicio de hopstand", "default": 10 }
  ];

  var currentStep = 0;
  var results = [];
  var stepDiv = document.getElementById('step');
  var nextBtn = document.getElementById('nextBtn');
  var resultsTable = document.getElementById('resultsTable');
  var tbody = resultsTable.getElementsByTagName('tbody')[0];

  var alarmTimeout;
  var alarmAudio = new Audio('alarm.mp3');
  alarmAudio.loop = true;

  // Unlock audio on first user interaction (legacy-safe)
  function unlockAudio() {
    var previousVolume = alarmAudio.volume;
    alarmAudio.volume = 0;
    var playPromise = alarmAudio.play();
    if (playPromise && playPromise.then) {
      playPromise.then(function() {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
        alarmAudio.volume = previousVolume;
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      })["catch"](function() {
        alarmAudio.volume = previousVolume;
      });
    }
  }
  document.addEventListener('touchstart', unlockAudio, false);
  document.addEventListener('click', unlockAudio, false);

  function playAlarmLoop() {
    alarmAudio.currentTime = 0;
    alarmAudio.play();
  }
  function stopAlarmLoop() {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }

  // TIMER
  var timerInterval;
  var timerSeconds = 0;

  function updateTimerDisplay() {
    var mins = Math.floor(timerSeconds / 60);
    var secs = timerSeconds % 60;
    var minsStr = mins < 10 ? '0' + mins : '' + mins;
    var secsStr = secs < 10 ? '0' + secs : '' + secs;
    document.getElementById('timer').textContent = minsStr + ':' + secsStr;
  }

  function startTimer(alarmSeconds) {
    clearInterval(timerInterval);
    clearTimeout(alarmTimeout);
    timerSeconds = 0;
    updateTimerDisplay();

    if (alarmSeconds) {
      alarmTimeout = setTimeout(function() {
        playAlarmLoop();
        swal({
          title: '¡Alarma!',
          text: 'Ha pasado el tiempo para este paso.',
          type: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#53ac50',
          allowOutsideClick: true
        }).then(function() {
          stopAlarmLoop();
        });
      }, alarmSeconds * 1000);
    }

    timerInterval = setInterval(function() {
      timerSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function updateStep() {
    if (currentStep < steps.length) {
      stepDiv.textContent = 'Proximo paso: ' + steps[currentStep];
      nextBtn.textContent = currentStep === 0 ? "Iniciar empaste" : "Proximo paso";
    } else {
      stepDiv.textContent = "Proceso completo!";
      nextBtn.style.display = "none";
      clearInterval(timerInterval);
    }
  }

  function addResult(paso, horario) {
    var row = document.createElement('tr');
    var stepCell = document.createElement('td');
    var timeCell = document.createElement('td');
    stepCell.textContent = paso;
    timeCell.textContent = horario;
    row.appendChild(stepCell);
    row.appendChild(timeCell);
    tbody.appendChild(row);
    row.scrollIntoView();
  }

  nextBtn.onclick = function() {
    var alarmSeconds = alarmIntervals[currentStep] || null;
    startTimer(alarmSeconds);

    var now = new Date();
    var timeString = now.getHours() + ':' +
      (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' +
      (now.getSeconds() < 10 ? '0' : '') + now.getSeconds();
    if (currentStep < steps.length) {
      addResult(steps[currentStep], timeString);
      results.push({ step: steps[currentStep], time: timeString });
      currentStep++;
      updateStep();
    }
  };

  document.getElementById('downloadBtn').onclick = function() {
    var csvContent = "Paso,Horario\n";
    for (var i = 0; i < results.length; i++) {
      csvContent += '"' + results[i].step + '","' + results[i].time + '"\n';
    }
    var blob = new Blob([csvContent], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'brewing_process.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // SHOW ALARM CONFIG FORM FIRST
  var formHtml = '<form id="alarmForm">';
  for (var i = 0; i < alarmSteps.length; i++) {
    var step = alarmSteps[i];
    formHtml += '<label style="display:block;margin:10px 0 5px 0;">' + step.label + ' (minutos):</label>' +
      '<input type="number" min="0" step="any" value="' + step["default"] + '" id="alarm_' + step.idx + '" style="width:80px;">';
  }
  formHtml += '</form>';

  swal({
    title: 'Configurar alarmas',
    html: formHtml,
    showCancelButton: false,
    confirmButtonText: 'Guardar',
    confirmButtonColor: '#53ac50',
    allowOutsideClick: false,
    preConfirm: function() {
      for (var i = 0; i < alarmSteps.length; i++) {
        var step = alarmSteps[i];
        var val = parseFloat(document.getElementById('alarm_' + step.idx).value);
        if (!isNaN(val) && val > 0) {
          alarmIntervals[step.idx] = val * 60;
        } else {
          delete alarmIntervals[step.idx];
        }
      }
    }
  }).then(function() {
    updateStep();
    updateTimerDisplay();
  });
};