<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UploadController extends Controller
{
    public function index()
    {
        return view('upload.index');
    }

    public function store(Request $request)
    {
        $result = $request->file('file')->store('uploaded');
        Log::info($request);
        return view('upload.index');
    }
}