# amityjs

## Install

If installation fails, you might be missing dependencies for node-speaker. As root run:
```
apt-get install libasound2-dev
apt-get install libgroove-dev libgrooveplayer-dev libgrooveloudness-dev libgroovefingerprinter-dev
```

## Run

```
node amity.js [conf/file.json]
```

configuration file defaults to conf.json

## Test 

`node run_tests.js` will execute all the tests in the test folder; run it with the `-nodemon` flag to run the tests every time a change is made; 
a sound will play if any test fails.
