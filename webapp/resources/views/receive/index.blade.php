<x-app-layout>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.3.2/dist/confetti.browser.min.js"></script>
    <style type="text/css">
        #snackbar {
            visibility: hidden;
            min-width: 500px;
            background-color: #313131;
            color: #fff;
            text-align: center;
            border-radius: 2px;
            padding: 15px 30px;
            position: fixed;
            z-index: 1;
            left: 50%;
            top: 50%;
            transform: translateX(-50%);
            box-shadow: 0 3px 9px rgb(0 0 0 / 25%);
        }

        #snackbar.show {
            visibility: visible;
            -webkit-animation: fadein 0.5s, fadeout 0.5s 1.6s;
            animation: fadein 0.5s, fadeout 0.5s 1.6s;
        }

        @-webkit-keyframes fadein {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        @keyframes fadein {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        @-webkit-keyframes fadeout {
            from {
                opacity: 1;
            }

            to {
                opacity: 0;
            }
        }

        @keyframes fadeout {
            from {
                opacity: 1;
            }

            to {
                opacity: 0;
            }
        }
    </style>

    <div id="snackbar"></div>

    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Receive') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                <div class="max-w-xl" id="userIdentityPart" data-user-id="{{ Auth::user()->id }}"
                    data-websocket-url="{{ config('custom.websocket-url') }}">
                    User: {{ Auth::user()->name }}({{ Auth::user()->id }}) へのメッセージを表示する画面です。
                </div>

                <hr />

                <div>
                    <table id="receiveHistory">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>送った人</th>
                                <th>メッセージ</th>
                                <th>サーバ時間</th>
                                <th>クライアント時間</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        let count = 0;

        function showSnackBar(message) {
            const bar = document.getElementById("snackbar");
            bar.className = "show";
            bar.innerHTML = message;
            setTimeout(() => {
                bar.className = bar.className.replace("show", "");
            }, 2000);
        }

        function insertTableFirstOf(signal) {
            const table = document.getElementById('receiveHistory');
            const row = table.insertRow(1);
            addTableColumnOf(row, signal.no);
            addTableColumnOf(row, signal.sender);
            addTableColumnOf(row, signal.content);
            addTableColumnOf(row, signal.serverTime);
            addTableColumnOf(row, signal.clientTime);
        }

        function addTableColumnOf(row, text) {
            const node = document.createTextNode(text);
            row.insertCell().appendChild(node);
        }

        function showNotification(signal) {
            const message = 'No.' + signal.no + ', ' + signal.sender + ' さんからの送信です。<p>' + signal.content +
                '<p>ServerTime:' + signal.serverTime + '<br>ClientTime:' + signal.clientTime;
            showSnackBar(message);
            confetti();
        }

        function displayOf(signal) {
            insertTableFirstOf(signal);
            showNotification(signal);
        }

        // ---- WebSocket Receive Functions ----

        function convertSignalDataOf(websocketReceiveData) {
            const reseive = websocketReceiveData;
            const signal = {
                no: ++count,
                sender: `[${reseive.fromUserId}]:${reseive.fromUserName}`,
                content: reseive.message,
                serverTime: reseive.fromServerTime,
                clientTime: new Date().toString()
            }
            return signal;
        }

        function onReceiveServerPush(event) {
            console.log(event);
            const receiveData = JSON.parse(event.data);
            const signal = convertSignalDataOf(receiveData);
            displayOf(signal);
        }

        function onLaod() {
            const idPart = document.getElementById('userIdentityPart');
            const userId = idPart.getAttribute('data-user-id');
            const websocketUrl = idPart.getAttribute('data-websocket-url');

            const wssPath = `wss://${websocketUrl}?userId=${userId}`;
            console.log('WebSocketFullPath:' + wssPath);

            const webSocket = new WebSocket(wssPath);
            webSocket.onmessage = onReceiveServerPush;
        }

        window.addEventListener('load', onLaod);
    </script>

</x-app-layout>
