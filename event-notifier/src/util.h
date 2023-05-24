#include <TFT_eSPI.h>
using namespace std;

char events[3][1024] = {
    "FIKA",
    "LUNCH",
    "BREAKFAST"};

static const uint16_t colors[6] PROGMEM = {
    TFT_CYAN,
    TFT_PURPLE,
    TFT_MAGENTA,
    TFT_GREEN,
    TFT_RED,
    TFT_PINK};

void reverseArray(uint16_t* arr , int low , int high)
{
  while(low<high)
  {
    swap(arr[low] , arr[high]);
    low++;
    high--;
  }
}

void shiftLeftByN(uint16_t* arr , int n , int k)
{
  k = k%n ; // we take a modulus in case the value of k is >= N
  reverseArray(arr , 0 , k-1);
  reverseArray(arr , k , n-1);
  reverseArray(arr , 0 , n-1);
}