<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('s3_uploaded_files', function (Blueprint $table) {
            $table->id();
            $table->string('original_name')->index();
            $table->string('mime_type')->index();
            $table->string('s3_url')->index();
            $table->integer('size')->index();
            $table->foreignId('user_id')->index();
            $table->timestamp('updated_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('s3_uploaded_files');
    }
};
