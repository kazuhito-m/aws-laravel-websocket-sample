<x-app-layout>
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

    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Receive') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                <div class="max-w-xl">
                    User: {{ Auth::user()->name }}({{ Auth::user()->id }}) へのメッセージを表示する画面です。
                </div>
                <div>
                    <table class="table-auto">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>送った人</th>
                                <th>メッセージ</th>
                                <th>サーバ時間</th>
                                <th>クライアント時間</th>
                            </tr>
                            <tr>
                                <td>1</td>
                                <td>みうらさん</td>
                                <td>こういうのが送られてきたら成功です。</td>
                                <td>2023/12/31 00:00:00</td>
                                <td>2023/12/31 00:00:00</td>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <button id="messebutton">下部中央にメッセージを出す</button>

    <div id="snackbar">
    </div>
    <script>
        function showSnackBar(message) {
            const bar = document.getElementById("snackbar");
            bar.className = "show";
            bar.innerHTML = message;
            setTimeout(() => {
                bar.className = bar.className.replace("show", "");
            }, 2000);
        }

        document.getElementById('messebutton').addEventListener('click', () => {
           showSnackBar("xxx さんからメッセージが来ました。<br> これもんです。");
        });
    </script>
</x-app-layout>
