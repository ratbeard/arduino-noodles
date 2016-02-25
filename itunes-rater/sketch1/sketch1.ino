int SW1 = 1;
int SW2 = 4;
int POT1 = A0;
float percent;
float lastPercent;


void setup() {
  Serial.begin(9600);
  pinMode(SW1, INPUT);
  pinMode(SW2, INPUT);
}

void loop() {
  int pressed1 = digitalRead(SW1);
  int pressed2 = digitalRead(SW2);
  
  float percent = analogRead(POT1) / 1023;
  if(percent != lastPercent) {
    Serial.print("V" + String(percent));  
    lastPercent = percent;
  }
  else if(pressed1 == LOW) {
    Serial.write("B1");
  }
  
  delay(100);
}
