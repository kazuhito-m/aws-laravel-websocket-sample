<?php

namespace App\Models\Uploded;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class S3UploadedFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'originaln_name',
        'mime_type',
        's3_uploaded_name',
        'size',
        'user_id',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}