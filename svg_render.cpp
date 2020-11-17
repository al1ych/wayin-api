#include <iostream>
#include <cmath>
#include <ctime>
#include <vector>
#include <map>
#include <set>
#include <algorithm>
#include <cstdio>
#include <string.h>
#include <iomanip>
#include <random>

using namespace std;

#define ll long long
#define inf 2000000007

int main()
{
  ios::sync_with_stdio(0);
  cin.tie(0);
  freopen("x.svg", "r", stdin);

  int c = 0;
  string s;

  while (getline(cin, s))
  {
    if (s.find(" d=") != -1)
    {
      c++;

      int d = s.find("d=");
      d += 3;
      // cout << s << " : ";
      cout << s[d];
      for (int i = d + 1; i < s.size() && s[i] != '\"'; i++)
      {
        cout << s[i];
      }
      cout << endl;
    }
  }

  cout << c << endl;
}

