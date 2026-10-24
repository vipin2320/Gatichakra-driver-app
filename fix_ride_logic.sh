#!/bin/bash

# 1. Update ride listener to filter vehicleType locally
# Using a temp file to cleanly insert the logic
cat << 'INNER_EOF' > temp_listener.patch
--- src/App.tsx.orig
+++ src/App.tsx
@@ -364,6 +364,9 @@
       snapshot.forEach((d) => {
         const data = d.data() as any;
         if (data.rejectedBy !== driverId) {
+          // Vehicle matching: Only show rides matching driver's vehicle type, or rides without vehicleType (for backward compatibility if needed, but here we strict match if exists)
+          if (data.vehicleType && data.vehicleType !== driverVehicleType) return;
+          
           rides.push({
             id: d.id,
             customerId: data.customerId || '',
INNER_EOF

# 2. Update handleAcceptRide to use transaction
cat << 'INNER_EOF' > temp_accept.patch
--- src/App.tsx.orig
+++ src/App.tsx
@@ -621,18 +621,27 @@
 
     if (incomingRide) {
       try {
         const rideRef = doc(db, 'rides', incomingRide.id);
-        await updateDoc(rideRef, {
-          rideStatus: 'driverAssigned',
-          driverId: driverId,
-          driverName: 'Ramesh Kumar',
-          driverPhone: phoneNumber,
-          driverVehicleNumber: 'UP 16 AB 1234',
-          driverVehicleModel: 'Maruti Swift Dzire',
-          driverCurrentLatitude: driverLat,
-          driverCurrentLongitude: driverLng,
-          acceptedAt: new Date().toISOString()
-        });
+        await runTransaction(db, async (transaction) => {
+          const rideDoc = await transaction.get(rideRef);
+          if (!rideDoc.exists()) {
+            throw "Ride does not exist!";
+          }
+          if (rideDoc.data().rideStatus !== 'searching') {
+            throw "Ride is no longer available (already accepted or cancelled).";
+          }
+          transaction.update(rideRef, {
+            rideStatus: 'driverAssigned',
+            driverId: driverId,
+            driverName: 'Ramesh Kumar',
+            driverPhone: phoneNumber,
+            driverVehicleType: driverVehicleType,
+            driverVehicleNumber: 'UP 16 AB 1234',
+            driverVehicleModel: 'Maruti Swift Dzire',
+            driverCurrentLatitude: driverLat,
+            driverCurrentLongitude: driverLng,
+            assignedAt: new Date().toISOString()
+          });
+        });
       } catch (e) {
-        console.warn("Direct update fallback:", e);
+        alert(e);
+        setIncomingRide(null);
+        return;
       }
       setAcceptedRide(incomingRide);
INNER_EOF

patch src/App.tsx < temp_listener.patch
patch src/App.tsx < temp_accept.patch
