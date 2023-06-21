<?php

namespace App\Models\Uploded;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class S3UploadedFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'original_name',
        'mime_type',
        'uploaded_name',
        'size',
        'user_id',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function url()
    {
        // FIXME 本当はモデルに対して「外部から値取得」するような機能を持たせてはだめですよ。
        return config('custom.image-site-url') . "/" . $this->uploaded_name;
    }
}