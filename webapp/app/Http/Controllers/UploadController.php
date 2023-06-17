<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Storage;

class UploadController extends Controller
{
    public function index()
    {
        return view('upload.index');
    }

    public function store(Request $request)
    {
        $result = Storage::disk('s3')->putFile('',$request->file('file'));
        Log::info($request->file('file')->getClientOriginalName());
        Log::info($result);
        return view('upload.index');
    }
}
