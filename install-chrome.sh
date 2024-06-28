#!/bin/bash

# Mengunduh file Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

# Mengekstrak file Chrome
ar x google-chrome-stable_current_amd64.deb
tar -xf data.tar.xz

# Menghapus file yang tidak perlu
rm google-chrome-stable_current_amd64.deb control.tar.gz data.tar.xz debian-binary

# Tidak menjalankan npm install di sini
