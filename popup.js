function setNewCallToLocalStorage(call) {
  const calls = JSON.parse(localStorage.getItem('calls')) ?? [];

  calls.push(call);
  localStorage.setItem('calls', JSON.stringify(calls));
}

function getAllCallsFromLocalStorage() {
  return JSON.parse(localStorage.getItem('calls'));
}

document.addEventListener('DOMContentLoaded', function () {
  const registration_container = document.querySelector('.registration_container');
  const mainContainer = document.querySelector('.main_container');
  const call_container = document.querySelector('.call_container');
  const micAccess = document.querySelector('.mic_access');
  const wrong_number = document.querySelector('.wrong_number');
  const remote_name = document.querySelector('.remote_name');
  const popup_incoming = document.querySelector('.popup_incoming');
  const historyContainer = document.querySelector('.history_container');
  const audioElement = document.getElementById('remoteAudio');
  const call_status = document.getElementById('call_status');
  const reset_button = document.getElementById('reset_button');
  const loginForm = document.getElementById('loginForm');
  const tableBody = document.getElementById('calls_table_body');

  const timerElement = document.getElementById('timer');

  let timerInterval;
  let seconds = 0;

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerElement.textContent = formatTime(seconds);
    timerInterval = setInterval(() => {
      seconds++;
      timerElement.textContent = formatTime(seconds);
    }, 1000);
  }

  const displayFlex = (elem) => {
    elem.style.display = 'flex';
  };
  const displayBlock = (elems = []) => {
    elems.forEach((elem) => (elem.style.display = 'block'));
  };

  const displayNone = (elems = []) => {
    elems.forEach((elem) => (elem.style.display = 'none'));
  };

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    function renderCallsTable() {
      const calls = getAllCallsFromLocalStorage();
      const userCalls = calls?.filter((call) => call.belongTo === username);

      tableBody.innerHTML = '';

      if (!userCalls || userCalls.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 4;
        cell.textContent = 'No calls found';

        return;
      }

      userCalls.reverse().forEach((call) => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = call.name;
        const startTime = new Date(call.start_time);
        const formattedDate = `${startTime.getDate().toString().padStart(2, '0')}.${(startTime.getMonth() + 1).toString().padStart(2, '0')}.${startTime.getFullYear()} ${startTime
          .getHours()
          .toString()
          .padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}:${startTime.getSeconds().toString().padStart(2, '0')}`;
        row.insertCell().textContent = formattedDate;

        const retryCell = row.insertCell();
        const retryButton = document.createElement('button');
        retryButton.classList.add('retry_button');
        retryButton.textContent = 'Перезвонить';
        retryButton.addEventListener('click', function () {
          try {
            const target = call.name;
            session = userAgent.call(target, options);
            const peer = session.connection;
            peer.ontrack = function (event) {
              const remoteStream = event.streams[0];
              audioElement.srcObject = remoteStream;
            };
          } catch (e) {}
        });
        retryCell.appendChild(retryButton);
      });
    }

    document.querySelector('.calls_history_btn').addEventListener('click', function () {
      document.querySelector('.back_to_main').addEventListener('click', function () {
        displayFlex(mainContainer);
        displayNone([historyContainer]);
      });

      renderCallsTable();

      displayFlex(historyContainer);
      displayNone([mainContainer]);
    });

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const server = document.getElementById('server').value;

    const socket = new JsSIP.WebSocketInterface('wss://' + server);

    const configuration = {
      uri: 'sip:' + username + '@' + server,
      password: password,
      display_name: username,
      sockets: [socket],
      register: true,
    };

    const userAgent = new JsSIP.UA(configuration);

    userAgent.on('registered', function () {
      displayNone([registration_container]);

      document.querySelector('.registered_name').innerHTML = username;
      displayFlex(mainContainer);
    });

    userAgent.start();

    document.querySelector('.unregister_btn').addEventListener('click', function () {
      userAgent.unregister({
        all: true,
      });
      userAgent.stop();
      wrong_number.innerHTML = '';
      displayNone([mainContainer]);
      displayFlex(registration_container);
    });
    // для Входящих звонков
    userAgent.on('newRTCSession', (data) => {
      if (data.originator === 'remote') {
        const session = data.session;

        if (session.direction === 'incoming') {
          const name = session._local_identity._uri._user;
          let callName;

          session.on('failed', () => {
            displayNone([popup_incoming]);
          });

          if (name === '0341931') {
            callName = '0341932';
          } else {
            callName = '0341931';
          }

          const call = {
            id: new Date().getTime(),
            belongTo: name,
            name: callName,
            start_time: new Date(),
          };

          setNewCallToLocalStorage(call);

          remote_name.innerHTML = session.remote_identity._uri._user;
          document.querySelector('.incoming_name').innerHTML = session.remote_identity._uri._user;
          displayFlex(popup_incoming);

          document.querySelector('.accept_call').addEventListener('click', () => {
            session.answer();

            session.on('failed', (e) => {
              if (e.cause === 'User Denied Media Access') {
                micAccess.innerHTML = 'Разрешите доступ к микрофону';

                // displayBlock
                displayNone([call_container, historyContainer]);
                displayFlex(mainContainer);
              }
            });

            const peer = session.connection;

            session.on('ended', () => {
              displayNone([call_container]);
              displayFlex(mainContainer);
            });

            peer.ontrack = function (event) {
              const remoteStream = event.streams[0];
              audioElement.srcObject = remoteStream;
            };

            call_status.innerHTML = 'Соединено';

            displayNone([popup_incoming, mainContainer, historyContainer]);
            displayBlock([timerElement, call_container]);

            startTimer();
          });

          reset_button.addEventListener('click', function () {
            displayNone([call_container]);
            displayFlex(mainContainer);

            session.terminate();
          });

          document.querySelector('.terminate_call').addEventListener('click', () => {
            session.terminate();

            displayNone([popup_incoming]);
          });
        }
      }
    });
    // Для кнопки call
    const eventHandlers = {
      progress: function (e) {
        const call = {
          id: new Date().getTime(),
          belongTo: e.response.from._uri._user,
          name: e.response.to._uri._user,
          start_time: new Date(),
        };
        setNewCallToLocalStorage(call);

        wrong_number.innerHTML = '';
        displayNone([timerElement, mainContainer, historyContainer]);
        remote_name.innerHTML = e.response.to._uri._user;
        displayBlock([call_container]);
        call_status.innerHTML = 'Вызываю';

        reset_button.addEventListener('click', function () {
          session.terminate();
        });
      },

      confirmed: function () {
        call_status.innerHTML = 'Соединено';

        displayBlock([timerElement]);
        startTimer();
      },

      failed: function (e) {
        if (e.cause === 'User Denied Media Access') {
          micAccess.innerHTML = 'Разрешите доступ к микрофону';
          displayNone([historyContainer]);
        }

        if (['Unavailable', 'Busy', 'Rejected', 'SIP Failure Code'].includes(e.cause)) {
          wrong_number.innerHTML = 'Отклонён';
        }

        displayFlex(mainContainer);
        displayNone([call_container]);
      },
      ended: function (e) {
        displayFlex(mainContainer);
        displayNone([call_container]);
      },
    };

    const options = {
      eventHandlers: eventHandlers,
      mediaConstraints: { audio: true, video: false },
    };

    let session;

    document.getElementById('callButton').addEventListener('click', function () {
      try {
        const target = document.getElementById('sipOrNumber').value;

        session = userAgent.call(target, options);
        const peer = session.connection;
        peer.ontrack = function (event) {
          const remoteStream = event.streams[0];
          audioElement.srcObject = remoteStream;
        };
      } catch (e) {
        console.log(e);
      }
    });
  });
});
