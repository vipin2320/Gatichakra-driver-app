#!/bin/bash
sed -i '367a\
        if (data.rejectedBy !== driverId) {\n          rides.push({' src/App.tsx
