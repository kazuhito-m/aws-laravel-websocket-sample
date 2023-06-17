<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Storage;
use App\Models\Uploded\S3UploadedFile;

class UploadController extends Controller
{
    public function index()
    {
        return view('upload.index');
    }

    public function store(Request $request)
    {
        $result = Storage::disk('s3')->putFile('', $request->file('file'));
        Log::info($request->file('file')->getClientOriginalName());
        Log::info($result);

        S3UploadedFile::create($this->makeRecord($request->file('file'), $result));

        return view('upload.index');
    }

    private function makeRecord(UploadedFile $file, string $s3UploadedName)
    {
        return array(
            'originaln_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            's3_uploaded_name' => $s3UploadedName,
            'size' => $file->getSize(),
            'user_id' => Auth::getUser()->getAuthIdentifier()
        );
    }
}