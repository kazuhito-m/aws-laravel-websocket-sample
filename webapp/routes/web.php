<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReceiveController;
use App\Http\Controllers\SendController;
use App\Http\Controllers\DirectSendController;
use App\Http\Controllers\WebsocketConnectionController;
use App\Http\Controllers\WebsocketConnectionDDBController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\MailSendController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::permanentRedirect('/', '/dashboard');

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::resource('users', UserController::class)->middleware(['auth', 'verified']);
Route::resource('receive', ReceiveController::class)->middleware(['auth', 'verified']);
Route::resource('send', SendController::class)->middleware(['auth', 'verified']);
Route::resource('directsend', DirectSendController::class)->middleware(['auth', 'verified']);
Route::resource('websocketconnections', WebsocketConnectionController::class)->middleware(['auth', 'verified']);
Route::resource('websocketconnectionsddb', WebsocketConnectionDDBController::class)->middleware(['auth', 'verified']);
Route::resource('upload', UploadController::class)->middleware(['auth', 'verified']);
Route::resource('mailsend', MailSendController::class)->middleware(['auth', 'verified']);

require __DIR__ . '/auth.php';
