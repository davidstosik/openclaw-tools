/**
 * Example: Book a blood test appointment at Miyashita Clinic
 */

require('dotenv').config();
const VoiceCallingSkill = require('../index');

async function bookBloodTest() {
  const skill = new VoiceCallingSkill();
  await skill.initialize();

  console.log('📞 Booking blood test appointment...\n');

  try {
    // Make the call
    const result = await skill.makeCall({
      phoneNumber: '+81-90-1234-5678', // Replace with actual clinic number
      template: 'clinic-blood-test',
      context: {
        patientName: '山田太郎',
        clinicName: '宮下クリニック',
        preferredDate: '2026年2月15日',
        purpose: '血液検査'
      },
      maxDuration: 600
    });

    console.log('✅ Call initiated successfully!');
    console.log('Call ID:', result.callId);
    console.log('Assistant ID:', result.assistantId);
    console.log('\nWaiting for call to complete...\n');

    // Poll for call completion (in production, use webhooks instead)
    let callComplete = false;
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max

    while (!callComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const status = await skill.getCallStatus(result.callId);
      console.log(`Status: ${status.status}`);
      
      if (status.status === 'ended') {
        callComplete = true;
        
        console.log('\n📊 Call completed!');
        console.log(`Duration: ${status.duration} seconds`);
        console.log(`Cost: $${status.cost}`);
        console.log(`Ended reason: ${status.endedReason}\n`);
        
        // Get transcript
        try {
          const transcript = await skill.getTranscript(result.callId);
          console.log('📝 Transcript:');
          console.log(transcript.transcript);
          console.log('\n');
        } catch (error) {
          console.log('⚠️  Transcript not available yet');
        }
        
        // Get structured data
        try {
          const data = await skill.getStructuredData(result.callId);
          console.log('📊 Extracted Data:');
          console.log(JSON.stringify(data.structuredData, null, 2));
          
          if (data.structuredData.success) {
            console.log('\n✅ Appointment booked successfully!');
            console.log(`   Date: ${data.structuredData.appointmentDate}`);
            console.log(`   Time: ${data.structuredData.appointmentTime}`);
            if (data.structuredData.specialInstructions) {
              console.log(`   Instructions: ${data.structuredData.specialInstructions}`);
            }
          } else {
            console.log('\n❌ Appointment booking failed');
            if (data.structuredData.alternativeDateOffered) {
              console.log(`   Alternative: ${data.structuredData.alternativeDateOffered}`);
            }
          }
        } catch (error) {
          console.log('⚠️  Structured data not available');
        }
      }
      
      attempts++;
    }

    if (!callComplete) {
      console.log('⚠️  Call did not complete within expected time');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
bookBloodTest();
