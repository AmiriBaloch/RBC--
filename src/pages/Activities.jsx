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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { FaEye, FaPencilAlt, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Applicants.css'; // Reusing the same CSS

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    category: '',
    description: '',
    link: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Try to get all activities without ordering first
      let activitiesQuery = query(
        collection(db, 'activities')
      );
      
      console.log("Attempting to fetch all activities...");
      let querySnapshot = await getDocs(activitiesQuery);
      console.log("Query completed, documents:", querySnapshot.size);
      
      // If no documents found, try with ordering
      if (querySnapshot.empty) {
        console.log("No documents found without ordering, trying with createdAt ordering...");
        activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(activitiesQuery);
      }
      
      const activitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt || Date.now())
      }));
      
      // Sort the activities by date in memory
      activitiesData.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log("Activities data processed:", activitiesData.length);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
      console.error('Error details:', error.code, error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to fetch activities: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = () => {
    setFormData({
      title: '',
      imageUrl: '',
      category: '',
      description: '',
      link: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleViewActivity = (activity) => {
    setCurrentActivity(activity);
    setShowViewModal(true);
  };

  const handleEditActivity = (activity) => {
    setCurrentActivity(activity);
    setFormData({
      title: activity.title || '',
      imageUrl: activity.imageUrl || '',
      category: activity.category || '',
      description: activity.description || '',
      link: activity.link || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.imageUrl?.trim()) {
      errors.imageUrl = 'Image URL is required';
    } else if (!/^https?:\/\/.+\..+/i.test(formData.imageUrl)) {
      errors.imageUrl = 'Please enter a valid URL';
    }
    
    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    }
    
    if (formData.link && !/^https?:\/\/.+\..+/i.test(formData.link)) {
      errors.link = 'Please enter a valid URL or leave empty';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log("Adding new activity:", formData);
      const docRef = await addDoc(collection(db, 'activities'), {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timestamp: Date.now()
      });
      
      console.log("Activity added with ID:", docRef.id);
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Activity added successfully'
      });
      
      fetchActivities();
      setShowAddModal(false);
      
    } catch (error) {
      console.error('Error adding activity:', error);
      console.error('Error details:', error.code, error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to add activity: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log("Updating activity:", currentActivity.id);
      await updateDoc(doc(db, 'activities', currentActivity.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Activity updated successfully'
      });
      
      fetchActivities();
      setShowEditModal(false);
      
    } catch (error) {
      console.error('Error updating activity:', error);
      console.error('Error details:', error.code, error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to update activity: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (activity) => {
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
        console.log("Deleting activity:", activity.id);
        await deleteDoc(doc(db, 'activities', activity.id));
        
        Swal.fire(
          'Deleted!',
          'Activity has been deleted.',
          'success'
        );
        
        fetchActivities();
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      console.error('Error details:', error.code, error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to delete activity: ${error.message}`
      });
    }
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

  const filteredActivities = activities.filter(activity => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (activity.title?.toLowerCase().includes(searchLower)) ||
      (activity.category?.toLowerCase().includes(searchLower)) ||
      (activity.description?.toLowerCase().includes(searchLower))
    );
  });

  // Predefined category options
  const categoryOptions = [
    'Event',
    'News',
    'Press Release',
    'Media Coverage',
    'Publication',
    'Award',
    'Other'
  ];

  return (
    <div className="applicants-page">
      <div className="page-header">
        <h1 className="page-title">Press Activities</h1>
        <Button variant="primary" onClick={handleAddActivity}>
          <FaPlus className="me-2" /> Add New Activity
        </Button>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="search-box mb-4">
            <FaSearch className="search-icon" />
            <Form.Control
              type="text"
              placeholder="Search activities by title, category or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="applicants-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map(activity => (
                    <tr key={activity.id}>
                      <td>
                        {activity.imageUrl && (
                          <img 
                            src={activity.imageUrl} 
                            alt={activity.title}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        )}
                      </td>
                      <td>{activity.title}</td>
                      <td>{activity.category || '-'}</td>
                      <td>{formatDate(activity.createdAt)}</td>
                      <td>
                        <div className="action-buttons-container">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="action-button"
                            onClick={() => handleViewActivity(activity)}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="action-button"
                            onClick={() => handleEditActivity(activity)}
                          >
                            <FaPencilAlt />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="action-button"
                            onClick={() => handleDeleteActivity(activity)}
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
              <p className="text-muted">No activities found</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* View Activity Modal */}
      {currentActivity && (
        <Modal 
          show={showViewModal} 
          onHide={() => setShowViewModal(false)} 
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>{currentActivity.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="activity-detail">
              {currentActivity.imageUrl && (
                <div className="mb-4 text-center">
                  <img 
                    src={currentActivity.imageUrl} 
                    alt={currentActivity.title}
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                </div>
              )}
              
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Category:</strong> {currentActivity.category || 'Not specified'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Date:</strong> {formatDate(currentActivity.createdAt)}</p>
                </Col>
              </Row>
              
              <h6 className="text-primary mb-3">DESCRIPTION:</h6>
              <div className="p-3 bg-light rounded mb-4">
                <p style={{ whiteSpace: 'pre-line' }}>{currentActivity.description}</p>
              </div>
              
              {currentActivity.link && (
                <>
                  <h6 className="text-primary mb-3">RELATED LINK:</h6>
                  <div className="p-3 bg-light rounded mb-4">
                    <a href={currentActivity.link} target="_blank" rel="noopener noreferrer">
                      {currentActivity.link}
                    </a>
                  </div>
                </>
              )}
              
              <p className="text-muted mt-3">
                <small>Posted: {formatDate(currentActivity.createdAt)}</small>
                {currentActivity.updatedAt && currentActivity.updatedAt !== currentActivity.createdAt && (
                  <small className="ms-3">Last updated: {formatDate(currentActivity.updatedAt)}</small>
                )}
              </p>
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
                handleEditActivity(currentActivity);
              }}
            >
              Edit
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      
      {/* Add Activity Modal */}
      <Modal 
        show={showAddModal} 
        onHide={() => setShowAddModal(false)} 
        centered 
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Activity</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
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
              <Form.Label>Image URL*</Form.Label>
              <Form.Control
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                isInvalid={!!formErrors.imageUrl}
                placeholder="https://example.com/image.jpg"
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.imageUrl}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Enter the URL of the image. This should be a direct link to the image file.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Form.Select>
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
                placeholder="Enter a detailed description of the activity"
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Related Link (Optional)</Form.Label>
              <Form.Control
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                isInvalid={!!formErrors.link}
                placeholder="https://example.com"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.link}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Optional: Enter a URL to additional information or related content.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
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
                  Adding...
                </>
              ) : (
                'Add Activity'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Edit Activity Modal */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        centered 
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Activity</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateSubmit}>
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
              <Form.Label>Image URL*</Form.Label>
              <Form.Control
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                isInvalid={!!formErrors.imageUrl}
                placeholder="https://example.com/image.jpg"
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.imageUrl}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Enter the URL of the image. This should be a direct link to the image file.
              </Form.Text>
              {formData.imageUrl && (
                <div className="mt-2 border p-2 d-inline-block">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Form.Select>
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
                placeholder="Enter a detailed description of the activity"
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Related Link (Optional)</Form.Label>
              <Form.Control
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                isInvalid={!!formErrors.link}
                placeholder="https://example.com"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.link}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Optional: Enter a URL to additional information or related content.
              </Form.Text>
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

export default Activities; 