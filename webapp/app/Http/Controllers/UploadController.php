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
            's3_url' => $this->buildS3UrlOf($s3UploadedName),
            'size' => $file->getSize(),
            'user_id' => Auth::getUser()->getAuthIdentifier()
        );
    }

    private function buildS3UrlOf(string $s3UploadedName)
    {
        $head = env('AWS_URL');
        if (is_null($head) || empty($head)) {
            $region = env('AWS_DEFAULT_REGION');
            $bucket = env('AWS_BUCKET');
            $head = "https://s3-{$region}.amazonaws.com/{$bucket}";
        }
        return "{$head}/{$s3UploadedName}";
    }

    public function destroy(Request $request)
    {
        $id = $request->get('id');
        $file = S3UploadedFile::find($id);
        Log::debug("削除対象 - ID:{$id}, S3-itemName:{$file->itemName()}");
        Storage::disk('s3')->delete($file->itemName());

        $file->delete();

        return redirect()->route('upload.index')
            ->with('success', 'user deleted successfully');

    }
}