import { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Modal, Spinner, Row, Col } from 'react-bootstrap';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { FaPlus, FaPencilAlt, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Jobs.css';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().substr(0, 10),
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Try to get all jobs without ordering first
      let jobsQuery = query(
        collection(db, 'jobs')
      );
      
      console.log("Attempting to fetch all jobs without ordering...");
      let querySnapshot = await getDocs(jobsQuery);
      console.log("Query completed, documents:", querySnapshot.size);
      
      // If no documents found, try with ordering
      if (querySnapshot.empty) {
        console.log("No documents found without ordering, trying with createdAt ordering...");
        jobsQuery = query(
          collection(db, 'jobs'),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(jobsQuery);
      }
      
      const jobsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort the jobs by date in memory if possible
      jobsData.sort((a, b) => {
        // Try to use createdAt first, fall back to date if available
        const dateA = a.createdAt?.toDate?.() || a.date?.toDate?.() || new Date(a.createdAt || a.date || 0);
        const dateB = b.createdAt?.toDate?.() || b.date?.toDate?.() || new Date(b.createdAt || b.date || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log("Jobs data processed:", jobsData.length);
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      console.error('Error details:', error.code, error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to fetch jobs: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrentJob(null);
    setFormData({
      title: '',
      date: new Date().toISOString().substr(0, 10),
      description: ''
    });
    setFormErrors({});
  };

  const handleViewModalClose = () => {
    setShowViewModal(false);
  };

  const handleModalShow = (job = null) => {
    if (job) {
      // Edit mode
      setCurrentJob(job);
      setFormData({
        title: job.title || '',
        date: job.date instanceof Date 
          ? job.date.toISOString().substr(0, 10) 
          : new Date(job.date || job.createdAt).toISOString().substr(0, 10),
        description: job.description || ''
      });
    } else {
      // Add mode
      setCurrentJob(null);
      setFormData({
        title: '',
        date: new Date().toISOString().substr(0, 10),
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleViewJob = (job) => {
    setCurrentJob(job);
    setShowViewModal(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Convert date string to Timestamp
      const dateValue = new Date(formData.date);
      
      const jobData = {
        title: formData.title,
        date: Timestamp.fromDate(dateValue),
        description: formData.description
      };
      
      if (currentJob) {
        // Update existing job
        jobData.updatedAt = Timestamp.now();
        await updateDoc(doc(db, 'jobs', currentJob.id), jobData);
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Job updated successfully'
        });
      } else {
        // Add new job
        jobData.createdAt = Timestamp.now();
        jobData.timestamp = Date.now(); // Add numeric timestamp for additional sorting reliability
        await addDoc(collection(db, 'jobs'), jobData);
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Job created successfully'
        });
      }
      
      // Refresh jobs list
      fetchJobs();
      
      // Close modal
      handleModalClose();
      
    } catch (error) {
      console.error('Error saving job:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to ${currentJob ? 'update' : 'create'} job`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (job) => {
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
        await deleteDoc(doc(db, 'jobs', job.id));
        
        Swal.fire(
          'Deleted!',
          'Job has been deleted.',
          'success'
        );
        
        // Refresh jobs list
        fetchJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete job'
      });
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="jobs-page">
      <div className="page-header">
        <h1 className="page-title">Jobs</h1>
        <Button 
          variant="primary" 
          className="add-button"
          onClick={() => handleModalShow()}
        >
          <FaPlus className="icon-left" /> Add Job
        </Button>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="search-box">
            <FaSearch className="search-icon" />
            <Form.Control
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="jobs-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Title</th>
                    <th style={{ width: '20%' }}>Date</th>
                    <th style={{ width: '25%' }}>Description</th>
                    <th style={{ width: '15%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => (
                    <tr key={job.id}>
                      <td>{job.title}</td>
                      <td>{formatDate(job.date || job.createdAt)}</td>
                      <td className="description-cell">
                        {job.description ? 
                          (job.description.length > 80 ? 
                            `${job.description.substring(0, 80)}...` : 
                            job.description) : 
                          ''}
                      </td>
                      <td>
                        <div className="action-buttons-container">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="action-button"
                            onClick={() => handleViewJob(job)}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="action-button"
                            onClick={() => handleModalShow(job)}
                          >
                            <FaPencilAlt />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="action-button"
                            onClick={() => handleDelete(job)}
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
              <p className="text-muted">No jobs found</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Add/Edit Modal */}
      <Modal 
        show={showModal} 
        onHide={handleModalClose} 
        centered 
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentJob ? 'Edit Job' : 'Add New Job'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title*</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                isInvalid={!!formErrors.title}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.title}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Date*</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                isInvalid={!!formErrors.date}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.date}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description*</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="description"
                value={formData.description}
                onChange={handleChange}
                isInvalid={!!formErrors.description}
                placeholder="Job description"
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose} disabled={isSubmitting}>
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
                'Save'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* View Job Modal */}
      {currentJob && (
        <Modal 
          show={showViewModal} 
          onHide={handleViewModalClose} 
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{currentJob.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="job-detail">
              <div className="job-header mb-4">
                <div className="mt-1 text-muted">
                  <strong>Date:</strong> {formatDate(currentJob.date || currentJob.createdAt)}
                </div>
              </div>
              
              {currentJob.description && (
                <div className="mb-4">
                  <h5>Description</h5>
                  <p style={{ whiteSpace: 'pre-line' }}>{currentJob.description}</p>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleViewModalClose}>
              Close
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                handleViewModalClose();
                handleModalShow(currentJob);
              }}
            >
              Edit
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default Jobs; 