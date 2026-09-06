#!/bin/sh
set -e

# Ensure persistent data directory exists and is owned by non-root node user
mkdir -p /data
chown -R node:node /data

# Drop root privileges and execute main command as node user
exec su-exec node "$@"
