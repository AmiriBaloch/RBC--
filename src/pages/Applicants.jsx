import { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Modal, Spinner, Badge, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { FaEye, FaPencilAlt, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Applicants.css';

const Applicants = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState('DistrictManager');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentApplicant, setCurrentApplicant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const collections = [
    { key: 'DistrictManager', label: 'District Manager' },
    { key: 'Trainer', label: 'Trainer' },
    { key: 'Supervisor', label: 'Supervisor' },
    { key: 'Surveyor', label: 'Surveyor' }
  ];

  useEffect(() => {
    fetchApplicants();
  }, [activeCollection]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      
      const applicantsQuery = query(
        collection(db, activeCollection),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(applicantsQuery);
      
      const applicantsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        collection: activeCollection
      }));
      
      setApplicants(applicantsData);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch applicants'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplicant = (applicant) => {
    setCurrentApplicant(applicant);
    setShowViewModal(true);
  };

  const handleEditApplicant = (applicant) => {
    setCurrentApplicant(applicant);
    setFormData({
      fullName: applicant.fullName || '',
      fatherName: applicant.fatherName || '',
      cnic: applicant.cnic || '',
      email: applicant.email || '',
      position: applicant.position || '',
      qualification: applicant.qualification || '',
      experience: applicant.experience || '',
      address: applicant.address || '',
      district: applicant.district || '',
      tehsil: applicant.tehsil || '',
      unionCouncil: applicant.unionCouncil || '',
      coverLetter: applicant.coverLetter || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await updateDoc(doc(db, currentApplicant.collection, currentApplicant.id), {
        ...formData,
        updatedAt: new Date()
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Applicant updated successfully'
      });
      
      fetchApplicants();
      setShowEditModal(false);
      
    } catch (error) {
      console.error('Error updating applicant:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update applicant'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplicant = async (applicant) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });
      
      if (result.isConfirmed) {
        await deleteDoc(doc(db, applicant.collection, applicant.id));
        
        Swal.fire(
          'Deleted!',
          'Applicant has been deleted.',
          'success'
        );
        
        fetchApplicants();
      }
    } catch (error) {
      console.error('Error deleting applicant:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete applicant'
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!formData.cnic?.trim()) {
      errors.cnic = 'CNIC is required';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredApplicants = applicants.filter(applicant => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (applicant.fullName?.toLowerCase().includes(searchLower)) ||
      (applicant.email?.toLowerCase().includes(searchLower)) ||
      (applicant.cnic?.toLowerCase().includes(searchLower)) ||
      (applicant.district?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="applicants-page">
      <div className="page-header">
        <h1 className="page-title">Job Applicants</h1>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="position-filters mb-4">
            <h5 className="mb-3">Filter by Position</h5>
            <div className="position-buttons">
              {collections.map((col) => (
                <Button
                  key={col.key}
                  variant={activeCollection === col.key ? "primary" : "outline-secondary"}
                  className="me-2 mb-2"
                  onClick={() => setActiveCollection(col.key)}
                >
                  {col.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="search-box mb-4">
            <FaSearch className="search-icon" />
            <Form.Control
              type="text"
              placeholder="Search applicants by name, email, CNIC, or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredApplicants.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="applicants-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>CNIC</th>
                    <th>Email</th>
                    <th>District</th>
                    <th>Qualification</th>
                    <th>Applied On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map(applicant => (
                    <tr key={applicant.id}>
                      <td>{applicant.fullName}</td>
                      <td>{applicant.cnic}</td>
                      <td>{applicant.email}</td>
                      <td>{applicant.district}</td>
                      <td>{applicant.qualification}</td>
                      <td>{formatDate(applicant.createdAt)}</td>
                      <td>
                        <div className="action-buttons-container">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="action-button"
                            onClick={() => handleViewApplicant(applicant)}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="action-button"
                            onClick={() => handleEditApplicant(applicant)}
                          >
                            <FaPencilAlt />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="action-button"
                            onClick={() => handleDeleteApplicant(applicant)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">No applicants found for this position</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* View Applicant Modal */}
      {currentApplicant && (
        <Modal 
          show={showViewModal} 
          onHide={() => setShowViewModal(false)} 
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Applicant Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="applicant-detail">
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Full Name:</strong> {currentApplicant.fullName}</p>
                  <p><strong>Father's Name:</strong> {currentApplicant.fatherName}</p>
                  <p><strong>CNIC:</strong> {currentApplicant.cnic}</p>
                  <p><strong>Email:</strong> {currentApplicant.email}</p>
                  <p><strong>Position:</strong> {currentApplicant.position}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Qualification:</strong> {currentApplicant.qualification}</p>
                  <p><strong>Experience:</strong> {currentApplicant.experience}</p>
                  <p><strong>District:</strong> {currentApplicant.district}</p>
                  <p><strong>Tehsil:</strong> {currentApplicant.tehsil}</p>
                  <p><strong>Union Council:</strong> {currentApplicant.unionCouncil}</p>
                </Col>
              </Row>
              
              <div className="mb-3">
                <p><strong>Address:</strong></p>
                <p>{currentApplicant.address}</p>
              </div>
              
              {currentApplicant.coverLetter && (
                <div>
                  <p><strong>Cover Letter:</strong></p>
                  <p>{currentApplicant.coverLetter}</p>
                </div>
              )}
              
              <div className="mt-3 text-muted">
                <p><small>Applied on: {formatDate(currentApplicant.createdAt)}</small></p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setShowViewModal(false);
                handleEditApplicant(currentApplicant);
              }}
            >
              Edit
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      
      {/* Edit Applicant Modal */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        centered 
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Applicant</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleChange}
                    isInvalid={!!formErrors.fullName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.fullName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Father's Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="fatherName"
                    value={formData.fatherName || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CNIC*</Form.Label>
                  <Form.Control
                    type="text"
                    name="cnic"
                    value={formData.cnic || ''}
                    onChange={handleChange}
                    isInvalid={!!formErrors.cnic}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.cnic}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email*</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    isInvalid={!!formErrors.email}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="text"
                    name="position"
                    value={formData.position || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Qualification</Form.Label>
                  <Form.Control
                    type="text"
                    name="qualification"
                    value={formData.qualification || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Experience</Form.Label>
                  <Form.Control
                    type="text"
                    name="experience"
                    value={formData.experience || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>District</Form.Label>
                  <Form.Control
                    type="text"
                    name="district"
                    value={formData.district || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tehsil</Form.Label>
                  <Form.Control
                    type="text"
                    name="tehsil"
                    value={formData.tehsil || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Union Council</Form.Label>
                  <Form.Control
                    type="text"
                    name="unionCouncil"
                    value={formData.unionCouncil || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Cover Letter</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="coverLetter"
                value={formData.coverLetter || ''}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Applicants; 