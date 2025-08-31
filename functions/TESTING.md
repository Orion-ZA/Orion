# Firebase Functions Testing Guide

This guide covers multiple ways to test your Firebase functions.

## 🚀 Quick Start

### 1. Local Testing with Firebase Emulator

Start the Firebase emulator:
```bash
npm run serve
```

The emulator will start on `http://localhost:5001` by default.

### 2. Manual Testing with cURL

Once the emulator is running, you can test your functions:

#### Test helloWorld function:
```bash
curl http://localhost:5001/your-project-id/us-central1/helloWorld
```

#### Test getTrails function:
```bash
# Get all trails
curl http://localhost:5001/your-project-id/us-central1/getTrails

# Filter by difficulty
curl "http://localhost:5001/your-project-id/us-central1/getTrails?difficulty=easy"

# Filter by location
curl "http://localhost:5001/your-project-id/us-central1/getTrails?location=Yosemite"
```



### 3. Automated Testing with Jest

Run unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### 4. Integration Testing

Use the provided test script:
```bash
node test-functions.js
```

**Note**: Update the `BASE_URL` in `test-functions.js` with your actual project ID.

## 📋 Testing Checklist

### Before Testing:
- [ ] Firebase emulator is running
- [ ] Your project ID is correctly set in test files
- [ ] Firestore database has test data (for getTrails function)

### Test Cases to Cover:

#### getTrails Function:
- [ ] GET request returns all trails
- [ ] GET request with difficulty filter works
- [ ] GET request with location filter works
- [ ] GET request with multiple filters works
- [ ] POST request returns 405 error
- [ ] Empty result set returns empty array
- [ ] CORS headers are set correctly

#### helloWorld Function:
- [ ] Returns correct message
- [ ] Response format is correct



#### getUserData Function (Callable):
- [ ] Authenticated user can access data
- [ ] Unauthenticated user gets error
- [ ] Invalid user ID handled properly

## 🔧 Configuration

### Update Project ID
Replace `your-project-id` in:
- `test-functions.js` (line 4)
- `test/index.test.js` (line 3)

### Service Account Key (Optional)
For production-like testing, you can add a service account key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Update the path in `test/index.test.js`

## 🐛 Troubleshooting

### Common Issues:

1. **Emulator not starting**: Check if port 5001 is available
2. **CORS errors**: Make sure CORS headers are set in functions
3. **Authentication errors**: Use Firebase Auth emulator for auth testing
4. **Database errors**: Ensure Firestore emulator is running

### Debug Mode:
Add `--debug` flag to see detailed logs:
```bash
firebase emulators:start --only functions --debug
```

## 📊 Test Results

After running tests, check:
- Console output for test results
- `coverage/` directory for coverage reports
- Firebase emulator logs for function execution details

## 🚀 Production Testing

For production testing:
1. Deploy functions: `npm run deploy`
2. Test against live URLs
3. Monitor Firebase Console logs
4. Use Firebase Functions logs: `npm run logs`
