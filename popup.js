document.addEventListener('DOMContentLoaded', function () {
  function setNewCallToLocalStorage(call) {
    let calls = JSON.parse(localStorage.getItem('calls'));

    if (calls === null) {
      calls = [];
    }

    calls.push(call);
    localStorage.setItem('calls', JSON.stringify(calls));
  }

  function getAllCallsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('calls'));
  }

  const registration_container = document.querySelector('.registration_container');
  const main_container = document.querySelector('.main_container');
  const call_container = document.querySelector('.call_container');
  const wrong_number = document.querySelector('.wrong_number');
  const remote_name = document.querySelector('.remote_name');
  const popup_incoming = document.querySelector('.popup_incoming');
  const audioElement = document.getElementById('remoteAudio');
  const call_status = document.getElementById('call_status');
  const reset_button = document.getElementById('reset_button');

  let timerElement = document.getElementById('timer');

  let timerInterval;
  let seconds = 0;
  function formatTime(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
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
  const displayBlock = (elem) => {
    elem.style.display = 'block';
  };

  const displayNone = (elem) => {
    elem.style.display = 'none';
  };

  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    function renderCallsTable() {
      let calls = getAllCallsFromLocalStorage();
      const tableBody = document.getElementById('calls_table_body');
      tableBody.innerHTML = '';
      calls = calls?.filter((call) => call.belongTo === username);

      if (!calls || calls.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.textContent = 'No calls found';
      } else {
        calls.reverse().forEach((call) => {
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
    }

    document.querySelector('.calls_history_btn').addEventListener('click', function () {
      const history_container = document.querySelector('.history_container');

      document.querySelector('.back_to_main').addEventListener('click', function () {
        displayBlock(main_container);
        displayNone(history_container);
      });

      renderCallsTable();

      history_container.style.display = 'flex';
      main_container.style.display = 'none';
    });
    //tim

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

    userAgent.on('registered', function (e) {
      displayNone(registration_container);

      document.querySelector('.registered_name').innerHTML = username;
      displayBlock(main_container);
    });

    userAgent.start();

    document.querySelector('.unregister_btn').addEventListener('click', function () {
      userAgent.unregister({
        all: true,
      });
      displayNone(main_container);
      displayBlock(registration_container);
    });
    // для Входящих звонков
    userAgent.on('newRTCSession', (data) => {
      if (data.originator === 'remote') {
        const session = data.session;

        if (session.direction === 'incoming') {
          const name = session._local_identity._uri._user;
          let callName;
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
          popup_incoming.style.display = 'flex';
          document.querySelector('.accept_call').addEventListener('click', () => {
            session.answer();

            const peer = session.connection;

            session.on('ended', () => {
              displayNone(call_container);
              displayBlock(main_container);
            });

            peer.ontrack = function (event) {
              const remoteStream = event.streams[0];
              audioElement.srcObject = remoteStream;
            };
            call_status.innerHTML = 'Соединено';
            displayNone(popup_incoming);
            // popup_incoming.style.display = 'none';
            displayNone(main_container);
            // main_container.style.display = 'none';
            displayBlock(timerElement);
            // timerElement.style.display = 'block';
            startTimer();
            displayBlock(call_container);
            // call_container.style.display = 'block';
            //передать имя таймер call status
          });

          reset_button.addEventListener('click', function () {
            displayNone(call_container);
            displayBlock(main_container);
            // call_container.style.display = 'none';
            // main_container.style.display = 'block';
            // end call
            session.terminate();
          });
          // Ответ на входящий звонок
          document.querySelector('.terminate_call').addEventListener('click', () => {
            session.terminate();

            displayNone(popup_incoming);
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
        displayNone(timerElement);
        displayNone(main_container);
        remote_name.innerHTML = e.response.to._uri._user;
        displayBlock(call_container);
        call_status.innerHTML = 'Вызываю';
        displayNone(document.querySelector('.history_container'));

        reset_button.addEventListener('click', function () {
          session.terminate();
        });
      },

      confirmed: function (e) {
        call_status.innerHTML = 'Соединено';

        displayBlock(timerElement);
        startTimer();
      },

      failed: function (e) {
        if (e.cause === 'User Denied Media Access') {
          document.querySelector('.mic_access').innerHTML = 'Разрешите доступ к микрофону';
        }

        if (e.cause !== 'Canceled' && e.cause !== 'Unavailable' && e.cause !== 'Busy' && e.cause !== 'Rejected') {
          wrong_number.innerHTML = 'Введите правильный номер';
        }

        displayBlock(main_container);
        displayNone(call_container);
      },
      ended: function (e) {
        displayBlock(main_container);
        displayNone(call_container);
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
      } catch (e) {}
    });
  });
});
