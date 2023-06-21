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
        $files = S3UploadedFile::select('*')
            ->where("user_id", Auth::getUser()->getAuthIdentifier())
            ->orderByDesc("id")
            ->get();
        return view('upload.index', compact('files'));
    }

    public function store(Request $request)
    {
        $result = Storage::disk('s3')->putFile('', $request->file('file'));

        S3UploadedFile::create($this->makeRecord($request->file('file'), $result));

        return $this->index();
    }

    private function makeRecord(UploadedFile $file, string $s3UploadedName)
    {
        return array(
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'uploaded_name' => $s3UploadedName,
            'size' => $file->getSize(),
            'user_id' => Auth::getUser()->getAuthIdentifier()
        );
    }

    public function destroy(Request $request)
    {
        $id = $request->get('id');
        $file = S3UploadedFile::find($id);
        Log::debug("削除対象 - ID:{$id}, S3-uploadedName:{$file->uploaded_name}");
        Storage::disk('s3')->delete($file->uploaded_name);

        $file->delete();

        return redirect()->route('upload.index')
            ->with('success', 'user deleted successfully');
    }
}