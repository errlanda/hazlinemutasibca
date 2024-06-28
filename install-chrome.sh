#!/bin/bash

# Install binutils for ar command
apt-get update
apt-get install -y binutils

# Mengunduh file Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

# Mengekstrak file Chrome
ar x google-chrome-stable_current_amd64.deb
tar -xf data.tar.xz

# Menghapus file yang tidak perlu
rm google-chrome-stable_current_amd64.deb

# Exit dengan status 0
exit 0
