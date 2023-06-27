<?php

namespace App\Models\MailSend;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SampleMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $customMessage,
        public readonly string $userName
    ) {
    }

    public function build()
    {
        return $this
            ->subject("{$this->userName}さんからのサンプルメールです")
            ->view('mailsend.sample-mail');
    }
}
