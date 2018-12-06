String message; //string that stores the incoming message
int a;
void setup()
{
  a = 0;
  Serial.begin(9600); //set baud rate
}

void loop()
{
  while(Serial.available())
  {//while there is data available on the serial monitor
    message+=char(Serial.read());//store string from serial command
  }
  if(!Serial.available())
  {
    if(message!="")
    {//if data is available
      Serial.println(message); //show the data
      message=""; //clear the data
    }
  }
  Serial.println('*');
  Serial.println(a);
  a = a+1;
  if(a > 9000){
    a = 0;  
  }
  // delay(5000); //delay
}
    
