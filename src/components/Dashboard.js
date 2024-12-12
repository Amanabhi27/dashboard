import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [cookies, setCookie] = useCookies(['userPreferences']);
  const location = useLocation();
  const history = useHistory();
  const { logout } = useAuth();

  useEffect(() => {
    // Load user preferences from cookies
    if (cookies.userPreferences) {
      const { startDate, endDate, age, gender } = cookies.userPreferences;
      setDateRange([
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          key: 'selection'
        }
      ]);
      setAge(age);
      setGender(gender);
    }

    // Parse URL parameters
    const searchParams = new URLSearchParams(location.search);
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    const urlAge = searchParams.get('age');
    const urlGender = searchParams.get('gender');

    if (urlStartDate && urlEndDate) {
      setDateRange([
        {
          startDate: new Date(urlStartDate),
          endDate: new Date(urlEndDate),
          key: 'selection'
        }
      ]);
    }
    if (urlAge) setAge(urlAge);
    if (urlGender) setGender(urlGender);

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/data', {
        headers: { Authorization: token },
        params: { 
          startDate: dateRange[0].startDate.toISOString(), 
          endDate: dateRange[0].endDate.toISOString(), 
          age, 
          gender 
        }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFilterChange = () => {
    fetchData();
    setCookie('userPreferences', { 
      startDate: dateRange[0].startDate, 
      endDate: dateRange[0].endDate, 
      age, 
      gender 
    }, { path: '/' });
    updateURL();
  };

  const updateURL = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('startDate', dateRange[0].startDate.toISOString());
    searchParams.set('endDate', dateRange[0].endDate.toISOString());
    if (age) searchParams.set('age', age);
    if (gender) searchParams.set('gender', gender);
    history.push({ search: searchParams.toString() });
  };

  const resetFilters = () => {
    setDateRange([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
      }
    ]);
    setAge('');
    setGender('');
    setCookie('userPreferences', {}, { path: '/' });
    history.push({ search: '' });
    fetchData();
  };

  const barChartData = {
    labels: [...new Set(data.map(item => item.feature))],
    datasets: [{
      label: 'Total Time Spent',
      data: [...new Set(data.map(item => item.feature))].map(feature => 
        data.filter(item => item.feature === feature).reduce((sum, item) => sum + item.timeSpent, 0)
      ),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    }]
  };

  const lineChartData = selectedFeature ? {
    labels: data.filter(item => item.feature === selectedFeature).map(item => item.date),
    datasets: [{
      label: `Time Trend for Feature ${selectedFeature}`,
      data: data.filter(item => item.feature === selectedFeature).map(item => item.timeSpent),
      borderColor: 'rgba(75, 192, 192, 1)',
      fill: false,
    }]
  } : null;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Interactive data visualization for product analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <DateRangePicker
                onChange={item => setDateRange([item.selection])}
                ranges={dateRange}
              />
            </div>
            <div className="space-y-4">
              <Select value={age} onValueChange={setAge}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Age Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Ages</SelectItem>
                  <SelectItem value="15-25">15-25</SelectItem>
                  <SelectItem value=">25">&gt;25</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleFilterChange}>Apply Filters</Button>
              <Button onClick={resetFilters}>Reset Filters</Button>
            </div>
          </div>
          <div className="mb-4">
            <Bar 
              data={barChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Feature Usage',
                  },
                },
                onClick: (_, [element]) => {
                  if (element) {
                    setSelectedFeature(barChartData.labels[element.index]);
                  }
                }
              }}
            />
          </div>
          {selectedFeature && (
            <div>
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: `Time Trend for Feature ${selectedFeature}`,
                    },
                  },
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: 'day'
                      }
                    }
                  },
                }}
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={logout}>Logout</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Dashboard;

