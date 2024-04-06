#!/bin/bash

mkdir /mnt/ramdisk
dd if=/dev/zero of=/tmp/ramdisk bs=1024 count=2048
mount -o loop /tmp/ramdisk /mnt/ramdisk
