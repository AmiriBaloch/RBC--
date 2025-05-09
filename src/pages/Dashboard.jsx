import { useState, useEffect } from 'react';
import { Card, Row, Col, Container, Button } from 'react-bootstrap';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FaBullhorn, 
  FaBriefcase, 
  FaUserTie, 
  FaChalkboardTeacher, 
  FaUserCog,
  FaStreetView,
  FaTachometerAlt,
  FaDownload
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    announcements: 0,
    jobs: 0,
    districtManagers: 0,
    trainers: 0,
    supervisors: 0,
    surveyors: 0
  });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch announcements count
        const announcementsSnapshot = await getDocs(collection(db, 'announcements'));
        
        // Fetch jobs count
        const jobsSnapshot = await getDocs(collection(db, 'jobs'));
        
        // Fetch applications for each position type
        const districtManagersSnapshot = await getDocs(collection(db, 'DistrictManager'));
        const trainersSnapshot = await getDocs(collection(db, 'Trainer'));
        const supervisorsSnapshot = await getDocs(collection(db, 'Supervisor'));
        const surveyorsSnapshot = await getDocs(collection(db, 'Surveyor'));
        
        // Update stats
        setStats({
          announcements: announcementsSnapshot.size,
          jobs: jobsSnapshot.size,
          districtManagers: districtManagersSnapshot.size,
          trainers: trainersSnapshot.size,
          supervisors: supervisorsSnapshot.size,
          surveyors: surveyorsSnapshot.size
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Function to convert data to CSV
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    // Get headers from first item
    const headers = Object.keys(data[0]).filter(key => key !== 'id');
    
    // Create CSV header row
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        // Handle special characters and commas in the data
        let cell = item[header] !== undefined ? item[header] : '';
        cell = cell.toString().replace(/"/g, '""');
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          cell = `"${cell}"`;
        }
        return cell;
      });
      csv += row.join(',') + '\n';
    });
    
    return csv;
  };

  // Function to download data as CSV
  const downloadCSV = async (collectionName, fileName) => {
    setDownloading(true);
    try {
      // Fetch all documents from the collection
      const snapshot = await getDocs(collection(db, collectionName));
      
      // Convert docs to array of data objects
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return { id: doc.id, ...docData };
      });
      
      // Convert to CSV
      const csv = convertToCSV(data);
      
      // Create a blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloading(false);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setDownloading(false);
    }
  };

  return (
    <div className="dashboard">
      <h1 className="page-title">
        <FaTachometerAlt className="me-2" /> Dashboard
      </h1>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <Container fluid>
          {/* Main Stats */}
          <Row className="stats-cards mb-4">
            <Col md={6} className="mb-4">
              <Card className="stat-card announcement-card">
                <Card.Body>
                  <div className="stat-icon">
                    <FaBullhorn />
                  </div>
                  <div className="stat-details">
                    <h2>{stats.announcements}</h2>
                    <p>Announcements</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} className="mb-4">
              <Card className="stat-card job-card">
                <Card.Body>
                  <div className="stat-icon">
                    <FaBriefcase />
                  </div>
                  <div className="stat-details">
                    <h2>{stats.jobs}</h2>
                    <p>Active Jobs</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Applicants Section */}
          <h2 className="section-title">Applicants by Position</h2>
          
          <Row className="applicant-stats">
            <Col lg={3} md={6} className="mb-4">
              <Card className="applicant-card district-manager-card">
                <Card.Body>
                  <div className="applicant-icon">
                    <FaUserTie />
                  </div>
                  <div className="applicant-details">
                    <h3>{stats.districtManagers}</h3>
                    <p>District Managers</p>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="download-btn"
                    onClick={() => downloadCSV('DistrictManager', 'district_managers')}
                    disabled={downloading || stats.districtManagers === 0}
                  >
                    <FaDownload className="me-1" /> Download CSV
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={3} md={6} className="mb-4">
              <Card className="applicant-card trainer-card">
                <Card.Body>
                  <div className="applicant-icon">
                    <FaChalkboardTeacher />
                  </div>
                  <div className="applicant-details">
                    <h3>{stats.trainers}</h3>
                    <p>Trainers</p>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="download-btn"
                    onClick={() => downloadCSV('Trainer', 'trainers')}
                    disabled={downloading || stats.trainers === 0}
                  >
                    <FaDownload className="me-1" /> Download CSV
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={3} md={6} className="mb-4">
              <Card className="applicant-card supervisor-card">
                <Card.Body>
                  <div className="applicant-icon">
                    <FaUserCog />
                  </div>
                  <div className="applicant-details">
                    <h3>{stats.supervisors}</h3>
                    <p>Supervisors</p>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="download-btn"
                    onClick={() => downloadCSV('Supervisor', 'supervisors')}
                    disabled={downloading || stats.supervisors === 0}
                  >
                    <FaDownload className="me-1" /> Download CSV
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={3} md={6} className="mb-4">
              <Card className="applicant-card surveyor-card">
                <Card.Body>
                  <div className="applicant-icon">
                    <FaStreetView />
                  </div>
                  <div className="applicant-details">
                    <h3>{stats.surveyors}</h3>
                    <p>Surveyors</p>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="download-btn"
                    onClick={() => downloadCSV('Surveyor', 'surveyors')}
                    disabled={downloading || stats.surveyors === 0}
                  >
                    <FaDownload className="me-1" /> Download CSV
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Total Applicants Card */}
          <Row className="mb-4">
            <Col md={12}>
              <Card className="total-applicants-card">
                <Card.Body className="text-center">
                  <h2 className="total-count">
                    Total Applicants: {stats.districtManagers + stats.trainers + stats.supervisors + stats.surveyors}
                  </h2>
                  <Button 
                    variant="outline-light" 
                    className="mt-3 download-all-btn"
                    onClick={() => {
                      const collections = [
                        {name: 'DistrictManager', fileName: 'district_managers'},
                        {name: 'Trainer', fileName: 'trainers'},
                        {name: 'Supervisor', fileName: 'supervisors'},
                        {name: 'Surveyor', fileName: 'surveyors'}
                      ];
                      collections.forEach(c => downloadCSV(c.name, c.fileName));
                    }}
                    disabled={downloading || (stats.districtManagers + stats.trainers + stats.supervisors + stats.surveyors) === 0}
                  >
                    <FaDownload className="me-1" /> Download All CSVs
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
};

export default Dashboard; 