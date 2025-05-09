import { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Modal, Alert, Spinner } from 'react-bootstrap';
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
import { FaPlus, FaPencilAlt, FaTrash, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().substr(0, 10)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Try to get all announcements without ordering first
      let announcementsQuery = query(
        collection(db, 'announcements')
      );
      
      console.log("Attempting to fetch all announcements without ordering...");
      let querySnapshot = await getDocs(announcementsQuery);
      console.log("Query completed, documents:", querySnapshot.size);
      
      // If no documents found, try with ordering
      if (querySnapshot.empty) {
        console.log("No documents found without ordering, trying with createdAt ordering...");
        announcementsQuery = query(
          collection(db, 'announcements'),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(announcementsQuery);
      }
      
      const announcementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(doc.data().date)
      }));
      
      // Sort the announcements by date in memory if possible
      announcementsData.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setAnnouncements(announcementsData);
      console.log("Announcements data processed:", announcementsData.length);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      console.error('Error details:', error.code, error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to fetch announcements: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrentAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      date: new Date().toISOString().substr(0, 10)
    });
    setFormErrors({});
  };

  const handleModalShow = (announcement = null) => {
    if (announcement) {
      // Edit mode
      setCurrentAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        date: announcement.date instanceof Date 
          ? announcement.date.toISOString().substr(0, 10) 
          : new Date(announcement.date).toISOString().substr(0, 10)
      });
    } else {
      // Add mode
      setCurrentAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().substr(0, 10)
      });
    }
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
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
      console.log("Submitting announcement with date:", dateValue);
      
      if (currentAnnouncement) {
        // Update existing announcement
        console.log("Updating announcement:", currentAnnouncement.id);
        await updateDoc(doc(db, 'announcements', currentAnnouncement.id), {
          title: formData.title,
          content: formData.content,
          date: Timestamp.fromDate(dateValue),
          updatedAt: Timestamp.now(),
          timestamp: Date.now() // Add numeric timestamp for additional sorting reliability
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Announcement updated successfully'
        });
      } else {
        // Add new announcement
        console.log("Adding new announcement");
        const newData = {
          title: formData.title,
          content: formData.content,
          date: Timestamp.fromDate(dateValue),
          createdAt: Timestamp.now(),
          timestamp: Date.now() // Add numeric timestamp for additional sorting reliability
        };
        console.log("New announcement data:", newData);
        
        const docRef = await addDoc(collection(db, 'announcements'), newData);
        console.log("Document added with ID:", docRef.id);
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Announcement created successfully'
        });
      }
      
      // Refresh announcements list
      fetchAnnouncements();
      
      // Close modal
      handleModalClose();
      
    } catch (error) {
      console.error('Error saving announcement:', error);
      console.error('Error details:', error.code, error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to ${currentAnnouncement ? 'update' : 'create'} announcement: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (announcement) => {
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
        await deleteDoc(doc(db, 'announcements', announcement.id));
        
        Swal.fire(
          'Deleted!',
          'Announcement has been deleted.',
          'success'
        );
        
        // Refresh announcements list
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete announcement'
      });
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

  const filteredAnnouncements = announcements.filter(announcement => 
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="announcements-page">
      <div className="page-header">
        <h1 className="page-title">Announcements</h1>
        <Button 
          variant="primary" 
          className="add-button"
          onClick={() => handleModalShow()}
        >
          <FaPlus className="icon-left" /> Add Announcement
        </Button>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="search-box">
            <FaSearch className="search-icon" />
            <Form.Control
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredAnnouncements.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="announcements-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Title</th>
                    <th style={{ width: '45%' }}>Content</th>
                    <th style={{ width: '15%' }}>Date</th>
                    <th style={{ width: '15%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnouncements.map(announcement => (
                    <tr key={announcement.id}>
                      <td>{announcement.title}</td>
                      <td className="content-cell">{announcement.content}</td>
                      <td>{formatDate(announcement.date)}</td>
                      <td>
                        <div className="action-buttons-container">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="action-button"
                            onClick={() => handleModalShow(announcement)}
                          >
                            <FaPencilAlt />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="action-button"
                            onClick={() => handleDelete(announcement)}
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
              <p className="text-muted">No announcements found</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleModalClose} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
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
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="content"
                value={formData.content}
                onChange={handleChange}
                isInvalid={!!formErrors.content}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.content}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
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
    </div>
  );
};

export default Announcements; 